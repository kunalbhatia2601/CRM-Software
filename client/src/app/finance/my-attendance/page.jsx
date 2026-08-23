import { getMyAttendance } from "@/actions/attendance.action";
import { getMyLeaveBalances } from "@/actions/leave.action";
import { listHolidays } from "@/actions/holidays.action";
import MyAttendanceContent from "@/components/attendance/MyAttendanceContent";

export default async function AccountsMyAttendancePage() {
  const now = new Date();
  const [recRes, balRes, holRes] = await Promise.all([
    getMyAttendance({ year: now.getFullYear(), month: now.getMonth() + 1 }),
    getMyLeaveBalances(now.getFullYear()),
    listHolidays(now.getFullYear()),
  ]);
  return (
    <MyAttendanceContent
      initialRecords={recRes.success ? recRes.data : []}
      initialBalances={balRes.success ? balRes.data : []}
      initialHolidays={holRes.success ? holRes.data : []}
    />
  );
}
