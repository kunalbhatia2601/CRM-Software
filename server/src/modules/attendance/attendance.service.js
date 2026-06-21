import prisma from "../../utils/prisma.js";
import { ApiError } from "../../utils/apiError.js";

const ATTENDANCE_INCLUDE = {
  user: {
    select: { id: true, firstName: true, lastName: true, email: true, avatar: true, role: true },
  },
  markedBy: {
    select: { id: true, firstName: true, lastName: true },
  },
  leaveRequest: {
    select: {
      id: true,
      leaveType: { select: { id: true, name: true, code: true, color: true } },
      fromDate: true,
      toDate: true,
    },
  },
};

/**
 * Convert a date string (YYYY-MM-DD) or Date → Date at UTC midnight.
 * Used for @db.Date columns so comparisons are on the calendar day.
 */
function toDateOnly(input) {
  if (!input) return null;
  const d = typeof input === "string" ? new Date(input) : new Date(input.getTime());
  // Use the date parts in local time, then convert to UTC midnight
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

function todayDateOnly() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

function computeWorkedMinutes(checkInAt, checkOutAt) {
  if (!checkInAt || !checkOutAt) return null;
  const diffMs = new Date(checkOutAt).getTime() - new Date(checkInAt).getTime();
  if (diffMs <= 0) return 0;
  return Math.floor(diffMs / 60000);
}

/** Add `n` days to a UTC-midnight date, returning a new UTC-midnight date. */
function addDays(date, n) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + n));
}

/** Map a leave day-type → attendance status for a single day of a leave span. */
function leaveDayTypeToStatus(dayType) {
  if (dayType === "FIRST_HALF") return "HALF_DAY_SECOND";  // morning off, worked afternoon
  if (dayType === "SECOND_HALF") return "HALF_DAY_FIRST";  // afternoon off, worked morning
  return "ON_LEAVE";                                        // FULL_DAY
}

/** Status for a given day `d` covered by approved leave `lv`. */
function leaveStatusForDay(lv, dMs) {
  const fromMs = toDateOnly(lv.fromDate).getTime();
  const toMs = toDateOnly(lv.toDate).getTime();
  if (dMs === fromMs) return leaveDayTypeToStatus(lv.fromDayType);
  if (dMs === toMs) return leaveDayTypeToStatus(lv.toDayType);
  return "ON_LEAVE";
}

// How far back to gap-fill when a user has no recent attendance (safety cap).
const MAX_BACKFILL_DAYS = 60;

class AttendanceService {
  async checkIn(userId, notes) {
    const date = todayDateOnly();
    const existing = await prisma.attendance.findUnique({
      where: { userId_date: { userId, date } },
    });

    const now = new Date();

    if (existing) {
      if (existing.checkInAt) {
        throw ApiError.badRequest("You have already checked in today");
      }
      return prisma.attendance.update({
        where: { id: existing.id },
        data: {
          checkInAt: now,
          status: existing.status === "ABSENT" ? "PRESENT" : existing.status,
          notes: notes ?? existing.notes,
        },
        include: ATTENDANCE_INCLUDE,
      });
    }

    return prisma.attendance.create({
      data: {
        userId,
        date,
        status: "PRESENT",
        checkInAt: now,
        notes: notes || null,
      },
      include: ATTENDANCE_INCLUDE,
    });
  }

  async checkOut(userId, notes) {
    const date = todayDateOnly();
    const existing = await prisma.attendance.findUnique({
      where: { userId_date: { userId, date } },
    });

    if (!existing || !existing.checkInAt) {
      throw ApiError.badRequest("You haven't checked in yet today");
    }
    if (existing.checkOutAt) {
      throw ApiError.badRequest("You have already checked out today");
    }

    const now = new Date();
    const workedMinutes = computeWorkedMinutes(existing.checkInAt, now);

    // Auto-adjust to half-day if <4 hours worked and status was PRESENT
    let status = existing.status;
    if (status === "PRESENT" && workedMinutes !== null && workedMinutes < 240) {
      status = "HALF_DAY_FIRST";
    }

    return prisma.attendance.update({
      where: { id: existing.id },
      data: {
        checkOutAt: now,
        workedMinutes,
        status,
        notes: notes ?? existing.notes,
      },
      include: ATTENDANCE_INCLUDE,
    });
  }

  async getTodayForUser(userId) {
    const date = todayDateOnly();
    return prisma.attendance.findUnique({
      where: { userId_date: { userId, date } },
      include: ATTENDANCE_INCLUDE,
    });
  }

  async getMyAttendance(userId, { year, month, from, to }) {
    const where = { userId };
    if (from && to) {
      where.date = { gte: toDateOnly(from), lte: toDateOnly(to) };
    } else if (year && month) {
      const start = new Date(Date.UTC(year, month - 1, 1));
      const end = new Date(Date.UTC(year, month, 0));
      where.date = { gte: start, lte: end };
    } else if (year) {
      const start = new Date(Date.UTC(year, 0, 1));
      const end = new Date(Date.UTC(year, 11, 31));
      where.date = { gte: start, lte: end };
    }

    return prisma.attendance.findMany({
      where,
      include: ATTENDANCE_INCLUDE,
      orderBy: { date: "desc" },
    });
  }

  /**
   * Daily attendance sheet: every active non-CLIENT user, joined with their
   * attendance record for the given date (if any).
   */
  async getDailySheet(dateStr) {
    const date = toDateOnly(dateStr);

    const users = await prisma.user.findMany({
      where: { status: "ACTIVE", role: { not: "CLIENT" } },
      select: { id: true, firstName: true, lastName: true, email: true, avatar: true, role: true },
      orderBy: [{ role: "asc" }, { firstName: "asc" }],
    });

    const records = await prisma.attendance.findMany({
      where: { date, userId: { in: users.map((u) => u.id) } },
      include: ATTENDANCE_INCLUDE,
    });
    const recordByUserId = new Map(records.map((r) => [r.userId, r]));

    return users.map((u) => ({
      user: u,
      attendance: recordByUserId.get(u.id) || null,
    }));
  }

  async getUserAttendance(userId, { year, month, from, to }) {
    return this.getMyAttendance(userId, { year, month, from, to });
  }

  /**
   * HR manually marks/updates a user's attendance for a date (upsert by user+date).
   */
  async manualMark(data, markerUserId) {
    const date = toDateOnly(data.date);
    const existing = await prisma.attendance.findUnique({
      where: { userId_date: { userId: data.userId, date } },
    });

    const checkInAt = data.checkInAt ? new Date(data.checkInAt) : undefined;
    const checkOutAt = data.checkOutAt ? new Date(data.checkOutAt) : undefined;
    const workedMinutes = checkInAt && checkOutAt ? computeWorkedMinutes(checkInAt, checkOutAt) : undefined;

    if (existing) {
      return prisma.attendance.update({
        where: { id: existing.id },
        data: {
          status: data.status,
          checkInAt: data.checkInAt === null ? null : checkInAt,
          checkOutAt: data.checkOutAt === null ? null : checkOutAt,
          workedMinutes: workedMinutes ?? null,
          notes: data.notes ?? existing.notes,
          markedById: markerUserId,
        },
        include: ATTENDANCE_INCLUDE,
      });
    }

    return prisma.attendance.create({
      data: {
        userId: data.userId,
        date,
        status: data.status,
        checkInAt: checkInAt || null,
        checkOutAt: checkOutAt || null,
        workedMinutes: workedMinutes ?? null,
        notes: data.notes || null,
        markedById: markerUserId,
      },
      include: ATTENDANCE_INCLUDE,
    });
  }

  async updateAttendance(id, data, markerUserId) {
    const existing = await prisma.attendance.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Attendance record not found");

    const checkInAt = data.checkInAt !== undefined
      ? (data.checkInAt ? new Date(data.checkInAt) : null)
      : existing.checkInAt;
    const checkOutAt = data.checkOutAt !== undefined
      ? (data.checkOutAt ? new Date(data.checkOutAt) : null)
      : existing.checkOutAt;
    const workedMinutes = checkInAt && checkOutAt ? computeWorkedMinutes(checkInAt, checkOutAt) : null;

    return prisma.attendance.update({
      where: { id },
      data: {
        status: data.status ?? existing.status,
        checkInAt,
        checkOutAt,
        workedMinutes,
        notes: data.notes !== undefined ? data.notes : existing.notes,
        markedById: markerUserId,
      },
      include: ATTENDANCE_INCLUDE,
    });
  }

  async deleteAttendance(id) {
    const existing = await prisma.attendance.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Attendance record not found");
    await prisma.attendance.delete({ where: { id } });
  }

  /**
   * Daily reconciliation — fills missing attendance for a date.
   *
   * Precedence (only acts on users WITHOUT a record for the date):
   *   1. Holiday (Holiday table)         → HOLIDAY
   *   2. Weekend (Settings.weekendDays)  → WEEKEND
   *   3. No check-in                     → ABSENT
   *
   * Never overwrites existing rows (check-ins, approved leave, manual marks).
   * Idempotent — safe to run multiple times for the same date.
   *
   * @param {string|Date} dateInput  Target date. Defaults to yesterday (UTC).
   * @returns {Promise<Object>} Summary of what was marked.
   */
  async reconcileDaily(dateInput) {
    const date = dateInput ? toDateOnly(dateInput) : this.#yesterdayDateOnly();

    // Weekend config from Settings (default Sun + Sat)
    const settings = await prisma.settings.findUnique({ where: { id: "default" } });
    const weekendDays = settings?.weekendDays?.length ? settings.weekendDays : [0, 6];
    const isWeekend = weekendDays.includes(date.getUTCDay());

    // Is this date a company holiday?
    const holiday = await prisma.holiday.findUnique({ where: { date } });

    // All active non-CLIENT users
    const users = await prisma.user.findMany({
      where: { status: "ACTIVE", role: { not: "CLIENT" } },
      select: { id: true },
    });

    // Users who already have a record for the date — skip them
    const existing = await prisma.attendance.findMany({
      where: { date, userId: { in: users.map((u) => u.id) } },
      select: { userId: true },
    });
    const hasRecord = new Set(existing.map((r) => r.userId));
    const missing = users.filter((u) => !hasRecord.has(u.id));

    // Decide status for missing users
    let status;
    if (holiday) status = "HOLIDAY";
    else if (isWeekend) status = "WEEKEND";
    else status = "ABSENT";

    let created = 0;
    if (missing.length > 0) {
      const result = await prisma.attendance.createMany({
        data: missing.map((u) => ({
          userId: u.id,
          date,
          status,
        })),
        skipDuplicates: true,
      });
      created = result.count;
    }

    return {
      date: date.toISOString().slice(0, 10),
      status,
      isWeekend,
      isHoliday: Boolean(holiday),
      holidayName: holiday?.name || null,
      totalUsers: users.length,
      alreadyRecorded: hasRecord.size,
      marked: created,
    };
  }

  #yesterdayDateOnly() {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
  }

  /**
   * Ingest clean biometric punch summary from the on-prem agent.
   *
   * Payload shape (agent already collapsed raw punches → first-in / last-out):
   *   {
   *     deviceSerial?: string,
   *     date: "YYYY-MM-DD",                       // target attendance day
   *     records: [
   *       { enrollNumber: 5,
   *         checkInAt?: "2026-06-18 09:07:15",    // device-local timestamp
   *         checkOutAt?: "2026-06-18 18:02:11" }
   *     ]
   *   }
   *
   * Maps enrollNumber → User.biometricCode. Upserts attendance for the date:
   *   - sets checkInAt / checkOutAt / workedMinutes
   *   - status PRESENT, or HALF_DAY_FIRST when both times present and worked < 240 min
   * Idempotent: a later pull (with checkout) updates the same row.
   * Unmapped enroll numbers are skipped and returned in `unmapped`.
   *
   * @returns {Promise<Object>} summary { date, processed, updated, created, unmapped, skipped }
   */
  async ingestBiometric(payload) {
    const records = Array.isArray(payload?.records) ? payload.records : [];
    if (!payload?.date) throw ApiError.badRequest("date is required (YYYY-MM-DD)");

    const date = toDateOnly(payload.date);      // the API-hit day (latest day to fill)
    const dateMs = date.getTime();
    const rangeStart = addDays(date, -MAX_BACKFILL_DAYS);

    // ── 1. Preload everything once ──────────────────────────

    // All active non-CLIENT users
    const users = await prisma.user.findMany({
      where: { status: "ACTIVE", role: { not: "CLIENT" } },
      select: { id: true, biometricCode: true },
    });
    const userIds = users.map((u) => u.id);

    // Today's punches → keyed by userId (enrollNumber maps via biometricCode)
    const codeToUserId = new Map(
      users.filter((u) => u.biometricCode != null).map((u) => [u.biometricCode, u.id])
    );
    const punchByUser = new Map();
    const unmapped = [];
    for (const rec of records) {
      const code = Number(rec.enrollNumber);
      const userId = codeToUserId.get(code);
      if (!userId) { unmapped.push(code); continue; }
      const checkInAt = rec.checkInAt ? new Date(rec.checkInAt) : null;
      const checkOutAt = rec.checkOutAt ? new Date(rec.checkOutAt) : null;
      if (!checkInAt && !checkOutAt) continue;
      punchByUser.set(userId, { checkInAt, checkOutAt });
    }

    // Weekend config
    const settings = await prisma.settings.findUnique({ where: { id: "default" } });
    const weekendDays = settings?.weekendDays?.length ? settings.weekendDays : [0, 6];

    // Holidays in the window → Set of UTC-midnight ms
    const holidayRows = await prisma.holiday.findMany({
      where: { date: { gte: rangeStart, lte: date } },
      select: { date: true },
    });
    const holidaySet = new Set(holidayRows.map((h) => toDateOnly(h.date).getTime()));

    // Existing attendance in the window → map "userId:dayMs" → row; track last day per user
    const existingRows = await prisma.attendance.findMany({
      where: { userId: { in: userIds }, date: { gte: rangeStart, lte: date } },
      select: { id: true, userId: true, date: true, checkInAt: true, checkOutAt: true, status: true },
    });
    const existingMap = new Map();
    const lastDayByUser = new Map();
    for (const r of existingRows) {
      const ms = toDateOnly(r.date).getTime();
      existingMap.set(`${r.userId}:${ms}`, r);
      if (!lastDayByUser.has(r.userId) || ms > lastDayByUser.get(r.userId)) {
        lastDayByUser.set(r.userId, ms);
      }
    }

    // Approved leaves overlapping the window → grouped by userId
    const leaveRows = await prisma.leaveRequest.findMany({
      where: {
        userId: { in: userIds },
        status: "APPROVED",
        fromDate: { lte: date },
        toDate: { gte: rangeStart },
      },
      select: { id: true, userId: true, fromDate: true, toDate: true, fromDayType: true, toDayType: true },
    });
    const leavesByUser = new Map();
    for (const lv of leaveRows) {
      if (!leavesByUser.has(lv.userId)) leavesByUser.set(lv.userId, []);
      leavesByUser.get(lv.userId).push(lv);
    }

    // ── 2. Walk each user day-by-day, fill gaps ─────────────

    const toCreate = [];
    const toUpdate = [];
    const counts = { PRESENT: 0, HALF_DAY_FIRST: 0, HALF_DAY_SECOND: 0, ON_LEAVE: 0, HOLIDAY: 0, WEEKEND: 0, ABSENT: 0 };
    let merged = 0;

    for (const u of users) {
      const punch = punchByUser.get(u.id);
      const userLeaves = leavesByUser.get(u.id) || [];

      // Resume from the day after the last recorded attendance (within window).
      // No prior record → only handle the hit date (avoid huge back-fill for new users).
      const lastMs = lastDayByUser.get(u.id);
      let cursor = lastMs ? addDays(new Date(lastMs), 1) : date;
      if (cursor.getTime() > dateMs) cursor = date;            // always include the hit date (for merge)
      if (cursor.getTime() < rangeStart.getTime()) cursor = rangeStart;

      for (let d = cursor; d.getTime() <= dateMs; d = addDays(d, 1)) {
        const dMs = d.getTime();
        const isHitDate = dMs === dateMs;
        const row = existingMap.get(`${u.id}:${dMs}`);

        // Existing row: only merge in today's punch (never clobber leave/holiday/manual marks).
        if (row) {
          if (isHitDate && punch) {
            const finalIn = punch.checkInAt || row.checkInAt || null;
            const finalOut = punch.checkOutAt || row.checkOutAt || null;
            const workedMinutes = computeWorkedMinutes(finalIn, finalOut);
            let status = row.status;
            // Promote a calendar/absent placeholder to PRESENT once a punch lands.
            if (["ABSENT", "WEEKEND", "HOLIDAY"].includes(row.status)) status = "PRESENT";
            if (status === "PRESENT" && finalIn && finalOut && workedMinutes < 240) status = "HALF_DAY_FIRST";
            toUpdate.push({ id: row.id, data: { checkInAt: finalIn, checkOutAt: finalOut, workedMinutes, status } });
            merged++;
          }
          continue;
        }

        // No row → decide by precedence: punch > leave > holiday > weekend > absent
        if (isHitDate && punch) {
          const workedMinutes = computeWorkedMinutes(punch.checkInAt, punch.checkOutAt);
          let status = "PRESENT";
          if (punch.checkInAt && punch.checkOutAt && workedMinutes < 240) status = "HALF_DAY_FIRST";
          toCreate.push({ userId: u.id, date: new Date(dMs), status, checkInAt: punch.checkInAt, checkOutAt: punch.checkOutAt, workedMinutes });
          counts[status]++;
          continue;
        }

        const lv = userLeaves.find((l) => dMs >= toDateOnly(l.fromDate).getTime() && dMs <= toDateOnly(l.toDate).getTime());
        if (lv) {
          const status = leaveStatusForDay(lv, dMs);
          toCreate.push({ userId: u.id, date: new Date(dMs), status, leaveRequestId: lv.id });
          counts[status]++;
          continue;
        }

        if (holidaySet.has(dMs)) {
          toCreate.push({ userId: u.id, date: new Date(dMs), status: "HOLIDAY" });
          counts.HOLIDAY++;
          continue;
        }

        if (weekendDays.includes(d.getUTCDay())) {
          toCreate.push({ userId: u.id, date: new Date(dMs), status: "WEEKEND" });
          counts.WEEKEND++;
          continue;
        }

        toCreate.push({ userId: u.id, date: new Date(dMs), status: "ABSENT" });
        counts.ABSENT++;
      }
    }

    // ── 3. Persist ──────────────────────────────────────────
    if (toCreate.length) {
      await prisma.attendance.createMany({ data: toCreate, skipDuplicates: true });
    }
    for (const up of toUpdate) {
      await prisma.attendance.update({ where: { id: up.id }, data: up.data });
    }

    return {
      date: payload.date,
      windowStart: rangeStart.toISOString().slice(0, 10),
      totalUsers: users.length,
      created: toCreate.length,
      merged,
      breakdown: counts,
      unmapped,
    };
  }
}

export default new AttendanceService();
export { toDateOnly, todayDateOnly };
