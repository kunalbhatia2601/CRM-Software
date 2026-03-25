/**
 * Meta Marketing API Service
 *
 * Proxies all campaign data directly from Meta (Facebook/Instagram) Ads API.
 * No local DB storage — everything is fetched/pushed in real-time.
 *
 * Uses Meta Marketing API v21.0 via REST (no SDK dependency needed).
 */

import settingsService from "../settings/settings.service.js";
import cache from "../../utils/cache.js";
import { ApiError } from "../../utils/apiError.js";

const META_API_BASE = "https://graph.facebook.com/v21.0";
const CACHE_TTL = 120; // 2 minutes for campaign data

class MetaService {
  /**
   * Get raw Meta credentials from settings (unmasked).
   */
  async getConfig() {
    const settings = await settingsService.getRawSettings();

    if (!settings.metaAccessToken || !settings.metaAdAccountId) {
      throw ApiError.badRequest(
        "Meta Ads not configured. Please add your Meta credentials in Owner Settings."
      );
    }

    return {
      accessToken: settings.metaAccessToken,
      adAccountId: settings.metaAdAccountId.startsWith("act_")
        ? settings.metaAdAccountId
        : `act_${settings.metaAdAccountId}`,
      appId: settings.metaAppId,
      appSecret: settings.metaAppSecret,
      pageId: settings.metaPageId,
    };
  }

  /**
   * Core fetch wrapper for Meta API calls.
   */
  async metaFetch(endpoint, options = {}) {
    const config = await this.getConfig();
    const url = new URL(`${META_API_BASE}${endpoint}`);

    // Always attach access token
    url.searchParams.set("access_token", config.accessToken);

    // Attach additional query params
    if (options.params) {
      for (const [key, val] of Object.entries(options.params)) {
        if (val !== undefined && val !== null) {
          url.searchParams.set(key, val);
        }
      }
    }

    const fetchOptions = {
      method: options.method || "GET",
      headers: { "Content-Type": "application/json" },
    };

    if (options.body) {
      fetchOptions.body = JSON.stringify(options.body);
    }

    const res = await fetch(url.toString(), fetchOptions);
    const data = await res.json();

    if (data.error) {
      console.error("Meta API Error:", data.error);
      throw ApiError.badRequest(
        data.error.message || "Meta API request failed"
      );
    }

    return data;
  }

  // ─── Campaigns ──────────────────────────────────────────

  /**
   * List all campaigns from the ad account.
   */
  async listCampaigns({ limit = 25, after, status } = {}) {
    const cacheKey = `meta:campaigns:${limit}:${after || ""}:${status || ""}`;

    return cache.get(
      cacheKey,
      async () => {
        const params = {
          fields: [
            "id", "name", "status", "objective", "buying_type",
            "daily_budget", "lifetime_budget", "budget_remaining",
            "start_time", "stop_time", "created_time", "updated_time",
            "special_ad_categories",
          ].join(","),
          limit,
        };

        if (after) params.after = after;
        if (status) params.effective_status = `["${status}"]`;

        const config = await this.getConfig();
        const data = await this.metaFetch(`/${config.adAccountId}/campaigns`, { params });

        return {
          campaigns: (data.data || []).map(this._formatCampaign),
          paging: data.paging || null,
        };
      },
      CACHE_TTL
    );
  }

  /**
   * Get a single campaign by ID with insights.
   */
  async getCampaign(campaignId) {
    const cacheKey = `meta:campaign:${campaignId}`;

    return cache.get(
      cacheKey,
      async () => {
        // Fetch campaign details + insights in parallel
        const [campaign, insights, adSets] = await Promise.all([
          this.metaFetch(`/${campaignId}`, {
            params: {
              fields: [
                "id", "name", "status", "objective", "buying_type",
                "daily_budget", "lifetime_budget", "budget_remaining",
                "start_time", "stop_time", "created_time", "updated_time",
                "special_ad_categories",
              ].join(","),
            },
          }),
          this.getCampaignInsights(campaignId).catch(() => null),
          this.getCampaignAdSets(campaignId).catch(() => []),
        ]);

        return {
          ...this._formatCampaign(campaign),
          insights: insights || {},
          adSets,
        };
      },
      CACHE_TTL
    );
  }

  /**
   * Get campaign-level insights (performance metrics).
   */
  async getCampaignInsights(campaignId, datePreset = "last_30d") {
    const data = await this.metaFetch(`/${campaignId}/insights`, {
      params: {
        fields: [
          "impressions", "clicks", "spend", "reach", "frequency",
          "cpc", "cpm", "ctr", "cpp",
          "actions", "cost_per_action_type",
          "date_start", "date_stop",
        ].join(","),
        date_preset: datePreset,
      },
    });

    const row = data.data?.[0] || {};

    // Extract lead & conversion actions
    const actions = row.actions || [];
    const leadActions = actions.find((a) => a.action_type === "lead") || {};
    const conversionActions = actions.find((a) => a.action_type === "offsite_conversion") || {};

    return {
      impressions: parseInt(row.impressions || 0),
      clicks: parseInt(row.clicks || 0),
      spend: parseFloat(row.spend || 0),
      reach: parseInt(row.reach || 0),
      frequency: parseFloat(row.frequency || 0),
      cpc: parseFloat(row.cpc || 0),
      cpm: parseFloat(row.cpm || 0),
      ctr: parseFloat(row.ctr || 0),
      leads: parseInt(leadActions.value || 0),
      conversions: parseInt(conversionActions.value || 0),
      dateStart: row.date_start,
      dateStop: row.date_stop,
    };
  }

  /**
   * Get daily breakdown insights for a campaign (for charts).
   */
  async getCampaignDailyInsights(campaignId, datePreset = "last_30d") {
    const cacheKey = `meta:insights:daily:${campaignId}:${datePreset}`;

    return cache.get(
      cacheKey,
      async () => {
        const data = await this.metaFetch(`/${campaignId}/insights`, {
          params: {
            fields: "impressions,clicks,spend,reach,ctr,cpc",
            date_preset: datePreset,
            time_increment: 1, // Daily breakdown
            limit: 90,
          },
        });

        return (data.data || []).map((row) => ({
          date: row.date_start,
          impressions: parseInt(row.impressions || 0),
          clicks: parseInt(row.clicks || 0),
          spend: parseFloat(row.spend || 0),
          reach: parseInt(row.reach || 0),
          ctr: parseFloat(row.ctr || 0),
          cpc: parseFloat(row.cpc || 0),
        }));
      },
      CACHE_TTL
    );
  }

  // ─── Ad Sets ────────────────────────────────────────────

  /**
   * Get ad sets for a campaign.
   */
  async getCampaignAdSets(campaignId) {
    const data = await this.metaFetch(`/${campaignId}/adsets`, {
      params: {
        fields: [
          "id", "name", "status", "daily_budget", "lifetime_budget",
          "budget_remaining", "bid_strategy", "billing_event",
          "optimization_goal", "targeting", "start_time", "end_time",
          "created_time",
        ].join(","),
        limit: 50,
      },
    });

    return (data.data || []).map(this._formatAdSet);
  }

  // ─── Ads ────────────────────────────────────────────────

  /**
   * Get ads for a campaign (through ad sets).
   */
  async getCampaignAds(campaignId) {
    const cacheKey = `meta:ads:${campaignId}`;

    return cache.get(
      cacheKey,
      async () => {
        const data = await this.metaFetch(`/${campaignId}/ads`, {
          params: {
            fields: [
              "id", "name", "status", "creative",
              "adset_id", "created_time", "updated_time",
            ].join(","),
            limit: 50,
          },
        });

        return (data.data || []).map((ad) => ({
          id: ad.id,
          name: ad.name,
          status: ad.status,
          adSetId: ad.adset_id,
          creativeId: ad.creative?.id,
          createdTime: ad.created_time,
          updatedTime: ad.updated_time,
        }));
      },
      CACHE_TTL
    );
  }

  // ─── Account Overview ───────────────────────────────────

  /**
   * Get ad account overview — summary stats across all campaigns.
   */
  async getAccountOverview(datePreset = "last_30d") {
    const cacheKey = `meta:overview:${datePreset}`;

    return cache.get(
      cacheKey,
      async () => {
        const config = await this.getConfig();

        // Fetch account info + insights in parallel
        const [account, insights] = await Promise.all([
          this.metaFetch(`/${config.adAccountId}`, {
            params: {
              fields: "id,name,account_status,currency,balance,amount_spent,business_name",
            },
          }),
          this.metaFetch(`/${config.adAccountId}/insights`, {
            params: {
              fields: "impressions,clicks,spend,reach,cpc,cpm,ctr,actions",
              date_preset: datePreset,
            },
          }).catch(() => ({ data: [] })),
        ]);

        const row = insights.data?.[0] || {};
        const actions = row.actions || [];
        const leadActions = actions.find((a) => a.action_type === "lead") || {};

        return {
          account: {
            id: account.id,
            name: account.name || account.business_name,
            status: account.account_status,
            currency: account.currency,
            balance: account.balance,
            totalSpent: account.amount_spent,
          },
          insights: {
            impressions: parseInt(row.impressions || 0),
            clicks: parseInt(row.clicks || 0),
            spend: parseFloat(row.spend || 0),
            reach: parseInt(row.reach || 0),
            cpc: parseFloat(row.cpc || 0),
            cpm: parseFloat(row.cpm || 0),
            ctr: parseFloat(row.ctr || 0),
            leads: parseInt(leadActions.value || 0),
          },
          datePreset,
        };
      },
      CACHE_TTL
    );
  }

  // ─── Campaign Actions ───────────────────────────────────

  /**
   * Update campaign status (ACTIVE, PAUSED, ARCHIVED).
   */
  async updateCampaignStatus(campaignId, status) {
    const validStatuses = ["ACTIVE", "PAUSED", "ARCHIVED"];
    if (!validStatuses.includes(status)) {
      throw ApiError.badRequest(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
    }

    const result = await this.metaFetch(`/${campaignId}`, {
      method: "POST",
      params: { status },
    });

    // Invalidate cache
    cache.delByPrefix("meta:");

    return result;
  }

  // ─── Lead Forms ─────────────────────────────────────────

  /**
   * Get lead forms from the page.
   */
  async getLeadForms() {
    const config = await this.getConfig();
    if (!config.pageId) {
      throw ApiError.badRequest("Facebook Page ID not configured in settings.");
    }

    const data = await this.metaFetch(`/${config.pageId}/leadgen_forms`, {
      params: {
        fields: "id,name,status,leads_count,created_time",
        limit: 50,
      },
    });

    return (data.data || []).map((form) => ({
      id: form.id,
      name: form.name,
      status: form.status,
      leadsCount: form.leads_count,
      createdTime: form.created_time,
    }));
  }

  /**
   * Get leads from a specific lead form.
   */
  async getLeadFormData(formId, { limit = 50, after } = {}) {
    const params = {
      fields: "id,created_time,field_data,ad_id,form_id,platform",
      limit,
    };
    if (after) params.after = after;

    const data = await this.metaFetch(`/${formId}/leads`, { params });

    return {
      leads: (data.data || []).map((lead) => {
        const fields = {};
        (lead.field_data || []).forEach((f) => {
          fields[f.name] = f.values?.[0] || "";
        });

        return {
          id: lead.id,
          createdTime: lead.created_time,
          adId: lead.ad_id,
          formId: lead.form_id,
          platform: lead.platform,
          fields,
        };
      }),
      paging: data.paging || null,
    };
  }

  // ─── Connection Test ────────────────────────────────────

  /**
   * Test if the Meta credentials are valid.
   */
  async testConnection() {
    try {
      const config = await this.getConfig();
      const account = await this.metaFetch(`/${config.adAccountId}`, {
        params: { fields: "id,name,account_status,currency,business_name" },
      });

      return {
        connected: true,
        accountName: account.name || account.business_name,
        accountId: account.id,
        currency: account.currency,
        status: account.account_status,
      };
    } catch (err) {
      return {
        connected: false,
        error: err.message || "Failed to connect to Meta Ads",
      };
    }
  }

  // ─── Formatters ─────────────────────────────────────────

  _formatCampaign(c) {
    return {
      id: c.id,
      name: c.name,
      status: c.status || c.effective_status,
      objective: c.objective,
      buyingType: c.buying_type,
      dailyBudget: c.daily_budget ? parseFloat(c.daily_budget) / 100 : null,
      lifetimeBudget: c.lifetime_budget ? parseFloat(c.lifetime_budget) / 100 : null,
      budgetRemaining: c.budget_remaining ? parseFloat(c.budget_remaining) / 100 : null,
      startTime: c.start_time,
      stopTime: c.stop_time,
      createdTime: c.created_time,
      updatedTime: c.updated_time,
      specialAdCategories: c.special_ad_categories || [],
    };
  }

  _formatAdSet(adSet) {
    return {
      id: adSet.id,
      name: adSet.name,
      status: adSet.status,
      dailyBudget: adSet.daily_budget ? parseFloat(adSet.daily_budget) / 100 : null,
      lifetimeBudget: adSet.lifetime_budget ? parseFloat(adSet.lifetime_budget) / 100 : null,
      budgetRemaining: adSet.budget_remaining ? parseFloat(adSet.budget_remaining) / 100 : null,
      bidStrategy: adSet.bid_strategy,
      billingEvent: adSet.billing_event,
      optimizationGoal: adSet.optimization_goal,
      targeting: adSet.targeting || {},
      startTime: adSet.start_time,
      endTime: adSet.end_time,
      createdTime: adSet.created_time,
    };
  }
}

export default new MetaService();
