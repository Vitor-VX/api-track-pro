import { NextFunction, Request, Response } from "express";

export class ScriptController {
    static async serve(req: Request, res: Response, next: NextFunction) {
        try {
            const script = `(() => {

      function getSession() {
        const SESSION_TIMEOUT = 30 * 60 * 1000;
        let session = JSON.parse(localStorage.getItem("track-session") || "null");
        const now = Date.now();

        if (!session || (now - session.lastActivity > SESSION_TIMEOUT)) {
          session = {
            sessionId: crypto.randomUUID(),
            lastActivity: now
          };
        } else {
          session.lastActivity = now;
        }

        localStorage.setItem("track-session", JSON.stringify(session));
        return session.sessionId;
      }
      const currentScript = document.currentScript;
      const SITE_ID = "${req.query.siteId}";

      function getUTMs() {
        const params = new URLSearchParams(window.location.search);
        return {
          utm_source: params.get("utm_source") || null,
          utm_medium: params.get("utm_medium") || null,
          utm_campaign: params.get("utm_campaign") || null,
          utm_term: params.get("utm_term") || null,
          utm_content: params.get("utm_content") || null,
        };
      }

      function getTrafficSource() {
        const utms = getUTMs();
        if (utms.utm_source) {
          const source = utms.utm_source.toLowerCase();
          const medium = (utms.utm_medium || "").toLowerCase();
          if (source.includes("facebook") || source.includes("meta") || source.includes("fb")) return "Facebook / Meta";
          if (source.includes("google")) return (medium === "cpc" || medium === "ppc") ? "Google Ads" : "Organic";
          return "Referral";
        }
        const ref = document.referrer.toLowerCase();
        if (!ref) return "Direct";
        if (ref.includes("facebook.com") || ref.includes("fb.com") || ref.includes("meta.com")) return "Facebook / Meta";
        if (ref.includes("google.")) return "Organic";
        return "Referral";
      }

      let visitorId = localStorage.getItem("track-visitor-id") || crypto.randomUUID();
      localStorage.setItem("track-visitor-id", visitorId);

      let sessionId = getSession();

      window.sendEvent = function (eventType, options = {}) {
        const payload = {
          siteId: SITE_ID,
          visitorId,
          sessionId,
          type: eventType,
          data: {
            url: window.location.href,
            title: document.title,
            referrer: document.referrer,
            device: /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop",
            browser: (() => { const ua = navigator.userAgent; if (ua.includes("Chrome")) return "Chrome"; if (ua.includes("Firefox")) return "Firefox"; if (ua.includes("Safari")) return "Safari"; return "Other"; })(),
            os: (() => { const ua = navigator.userAgent; if (/Android/i.test(ua)) return "Android"; if (/iPhone|iPad|iPod/i.test(ua)) return "iOS"; if (/Windows/i.test(ua)) return "Windows"; if (/Macintosh/i.test(ua)) return "MacOS"; return "Other"; })(),
            ...options.data
          },
          source: options.source || getTrafficSource(),
          utm: options.utm || getUTMs()
        };

        fetch("https://api.trackyflow.sbs/api/v1/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }).catch(err => console.warn("TrackPro event failed", err));
      };

      let scrollMarkers = [25, 50, 75, 100];
      let reached = new Set();
      addEventListener("scroll", () => {
        const scrollPercent = Math.round((window.scrollY + window.innerHeight) / document.body.scrollHeight * 100);
        scrollMarkers.forEach(value => {
          if (scrollPercent >= value && !reached.has(value)) {
            reached.add(value);
            window.sendEvent(\`scroll_\${value}\`);
          }
        });
      });

      addEventListener("DOMContentLoaded", () => {
        document.querySelectorAll("[data-track]").forEach(el => {
          el.addEventListener("click", () => window.sendEvent("cta_click"));
        });
      });

      window.sendEvent("page_view");
    })();`;

            res.header("Access-Control-Allow-Origin", "*");
            res.header("Cross-Origin-Resource-Policy", "cross-origin");
            res.header("Content-Type", "application/javascript");
            res.send(script);
        } catch (error) {
            next(error);
        }
    }
};
