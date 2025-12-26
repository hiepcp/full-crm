
import React, { lazy, useMemo, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Loadable from "@presentation/components/Loadable";
import RouteGuard from "@app/routes/guards/RouteGuard";
import NotFound from "@presentation/pages/NotFound";

const DashboardDefault = Loadable(lazy(() => import("@presentation/pages/dashboard")));
const DocumentTypePage = Loadable(lazy(() => import("@presentation/pages/document-type")));
const CustomerPage = Loadable(lazy(() => import("@presentation/pages/customer")));
const LeadPage = Loadable(lazy(() => import("@presentation/pages/lead")));
const DealPage = Loadable(lazy(() => import("@presentation/pages/deal")));
const GoalsPage = Loadable(lazy(() => import("@presentation/pages/goals")));
const ActivityPage = Loadable(lazy(() => import("@presentation/pages/activity")));
const ContactPage = Loadable(lazy(() => import("@presentation/pages/contact")));
const InboxPage = Loadable(lazy(() => import("@presentation/pages/inbox")));
const TemplateEmailPage = Loadable(lazy(() => import("@presentation/pages/template-email")));
const HcmWorkerRegisterPage = Loadable(lazy(() => import("@presentation/pages/user/HcmWorkerRegister")));
const SettingScorePage = Loadable(lazy(() => import("@src/presentation/pages/setting-score")));
const CalendarAllPage = Loadable(lazy(() => import("@src/presentation/pages/calendar/calendar-all")));
const CalendarMyPage = Loadable(lazy(() => import("@src/presentation/pages/calendar/calendar-my")));

const codeToComponent = {
  dashboard: <DashboardDefault />,
  "document-type": <DocumentTypePage />,
  "customers": <CustomerPage />,
  "leads": <LeadPage />,
  "deals": <DealPage />,
  "goals": <GoalsPage />,
  "activities": <ActivityPage />,
  "contacts": <ContactPage />,
  "inbox": <InboxPage />,
  "template-email": <TemplateEmailPage />,
  "setting-score": <SettingScorePage />,
  "user-register-hcm": <HcmWorkerRegisterPage />,
  "calendar-all": <CalendarAllPage />,
  "calendar-my": <CalendarMyPage />,
};

function pathPatternToRegex(pattern) {
  if (!pattern) return null;
  let regexStr = pattern
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\\:(\w+)/g, "[^/]+");
  return new RegExp("^" + regexStr + "$");
}

export default function RouteResolver() {
  const location = useLocation();

  // Lấy menuItems từ localStorage
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('userMenu');
      if (raw) {
        setMenuItems(JSON.parse(raw));
      } else {
        setMenuItems([]);
      }
    } catch {
      setMenuItems([]);
    }
    setLoading(false);
  }, []);

  const defaultUrlByCode = {
    dashboard: "/",
    "customers": "/customers",
    "leads": "/leads",
    "deals": "/deals",
    "goals": "/goals",
    "activities": "/activities",
    "contacts": "/contacts",
    "inbox": "/connect/inbox",
    "template-email": "/template-email",
    "setting-score": "/setting-score",
    "user-register-hcm": "/users/register-hcm",
    "calendar-all": "/calendar/all",
    "calendar-my": "/calendar/my",
  };

  const matched = useMemo(() => {
    if (loading) return null;
    const current = location.pathname;

    let item = menuItems.find(
      (mi) => (mi.url || defaultUrlByCode[mi.code]) === current
    );
    if (item) return item;

    for (const mi of menuItems) {
      const pattern = mi.url || defaultUrlByCode[mi.code];
      const rx = pathPatternToRegex(pattern);
      if (rx && rx.test(current)) return mi;
    }
    return null;
  }, [menuItems, loading, location.pathname]);

  if (loading) {
    return <div>Loading menus...</div>;
  }

  if (!matched) {
    return <RouteGuard element={<NotFound />} menuId={null} />;
  }

  const element = codeToComponent[matched.code] || <NotFound />;
  return <RouteGuard element={element} menuId={matched.code} />;
}
