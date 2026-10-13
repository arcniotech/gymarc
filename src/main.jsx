import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  Activity, ArrowDownRight, ArrowUpRight, Bell, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight,
  CircleHelp, ClipboardList, CreditCard, Download, Dumbbell, Ellipsis, FileText, Filter, LayoutDashboard,
  LogOut, Menu, Moon, MoreHorizontal, Plus, Search, Settings, ShieldCheck, SlidersHorizontal, Sparkles,
  Sun, Users, Wallet, X, Zap, UserPlus, UserCheck, UserX, RotateCcw, Clock, Phone, Mail, MessageSquare,
  Trash2, Edit3, Grid, List, AlertTriangle, CheckCircle2, Printer, Send
} from 'lucide-react';
import './style.css';
import {
  ClientPage, Invoices, Announcements, Notifications, SettingsPage, GenericPage, exportExcel,
  Leads, PastClients, EnrollClientModal, RemoveClientModal, WorkoutPlans, DietPlans, ActivityHistory
} from './extra.jsx';

export const Ctx = createContext(null);
export const useGym = () => useContext(Ctx);
const money = n => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const iso = d => new Date(d).toISOString().slice(0, 10);
const today = iso(new Date());

const starter = {
  plans: [
    ['Basic', 1, 1000],
    ['Standard', 3, 2700],
    ['Premium', 6, 5000],
    ['Annual', 12, 9000],
    ['Personal Training', 1, 4000]
  ].map(([name, months, price], i) => ({
    id: `PL-${i + 1}`,
    name,
    duration: `${months} month${months > 1 ? 's' : ''}`,
    months,
    price,
    status: 'Active',
    description: `${name} membership with access to GymArc facilities`,
    facilities: ['Gym floor', 'Locker room', 'Group classes'],
    training: i === 4 ? 'Included' : 'Optional'
  })),

  trainers: [
    ['Ananya Sharma', 'Strength & conditioning', '5 years'],
    ['Rohan Mehta', 'Functional training', '7 years'],
    ['Priya Nair', 'Yoga & mobility', '4 years'],
    ['Arjun Kapoor', 'Weight training', '8 years'],
    ['Meera Iyer', 'Pilates', '6 years']
  ].map((x, i) => ({
    id: `TR-${String(i + 1).padStart(3, '0')}`,
    name: x[0],
    specialty: x[1],
    experience: x[2],
    clients: 4 + i,
    initials: x[0].split(' ').map(y => y[0]).join('')
  })),

  clients: Array.from({ length: 20 }, (_, i) => {
    const names = [
      'Aarav Patel', 'Diya Shah', 'Kabir Mehta', 'Isha Rao', 'Vivaan Singh',
      'Anaya Iyer', 'Reyansh Nair', 'Saanvi Kapoor', 'Aditya Joshi', 'Myra Reddy',
      'Arjun Das', 'Aadhya Menon', 'Rohan Gupta', 'Kiara Malhotra', 'Ishaan Verma',
      'Pari Chawla', 'Dhruv Bansal', 'Sara Khan', 'Atharv Kulkarni', 'Tara Bose'
    ];
    const plan = ['Standard', 'Premium', 'Basic', 'Annual', 'Personal Training'][i % 5];
    const p = ['Standard', 'Premium', 'Basic', 'Annual', 'Personal Training'].indexOf(plan);
    const pl = [2700, 5000, 1000, 9000, 4000][p];
    const custom = i === 2 || i === 8;
    const fee = custom ? pl - 400 : pl;
    const paid = [1000, fee, fee * 0.4, fee, 0][i % 5];
    let start = new Date();
    start.setDate(start.getDate() - ((i * 13 + 20) % 220));
    let exp = new Date(start);
    exp.setMonth(exp.getMonth() + [3, 6, 1, 12, 1][p]);
    let due = new Date();
    due.setDate(due.getDate() + ((i % 7) - 2) * 4);
    return {
      id: `GYM-${String(2401 + i).slice(-4)}`,
      name: names[i],
      email: `${names[i].toLowerCase().replaceAll(' ', '.')}@mail.com`,
      phone: `+91 98${String(12345670 + i)}`,
      plan,
      fee,
      standardFee: pl,
      paid: Math.round(paid),
      status: i === 14 ? 'Inactive' : 'Active',
      payment: paid >= fee ? 'Paid' : due < new Date() ? 'Overdue' : paid > 0 ? 'Partial' : 'Pending',
      due: iso(due),
      expiry: iso(exp),
      trainer: ['Ananya Sharma', 'Rohan Mehta', 'Priya Nair', 'Arjun Kapoor', 'Meera Iyer'][i % 5],
      joined: iso(start),
      custom,
      gender: i % 2 ? 'Female' : 'Male'
    };
  }),

  // GymArc Leads Pipeline
  leads: [
    { id: 'LD-101', name: 'Vikram Malhotra', email: 'vikram.m@gmail.com', phone: '+91 98201 11223', source: 'Instagram', goal: 'Weight Loss & Muscle Gain', interestedPlan: 'Standard', status: 'New', assignedTo: 'Ananya Sharma', followUp: iso(new Date(Date.now() + 86400000)), notes: 'Enquired about evening gym slots and personal trainer packages.', createdAt: iso(new Date(Date.now() - 86400000 * 2)) },
    { id: 'LD-102', name: 'Pooja Hegde', email: 'pooja.h@yahoo.com', phone: '+91 98199 44556', source: 'Walk-in', goal: 'Personal Training', interestedPlan: 'Personal Training', status: 'Trial Scheduled', assignedTo: 'Rohan Mehta', followUp: iso(new Date()), notes: 'Trial workout scheduled for tomorrow 8:00 AM.', createdAt: iso(new Date(Date.now() - 86400000 * 3)) },
    { id: 'LD-103', name: 'Sameer Sen', email: 'sameer.sen@outlook.com', phone: '+91 98450 77889', source: 'Google Search', goal: 'Functional Fitness', interestedPlan: 'Premium', status: 'Contacted', assignedTo: 'Arjun Kapoor', followUp: iso(new Date(Date.now() + 86400000 * 2)), notes: 'Spoke over phone. Sent membership brochure on WhatsApp.', createdAt: iso(new Date(Date.now() - 86400000 * 5)) },
    { id: 'LD-104', name: 'Ritika Sharma', email: 'ritika.s@gmail.com', phone: '+91 98334 55667', source: 'Referral', goal: 'Yoga & Flexibility', interestedPlan: 'Standard', status: 'Follow Up', assignedTo: 'Priya Nair', followUp: iso(new Date(Date.now() + 86400000)), notes: 'Friend of Kabir Mehta. Offered 10% referral discount.', createdAt: iso(new Date(Date.now() - 86400000 * 4)) },
    { id: 'LD-105', name: 'Kunal Deshmukh', email: 'kunal.d@gmail.com', phone: '+91 99200 33445', source: 'Website', goal: 'General Fitness', interestedPlan: 'Annual', status: 'New', assignedTo: 'Ananya Sharma', followUp: iso(new Date()), notes: 'Interested in annual membership deal before price hike.', createdAt: iso(new Date(Date.now() - 86400000)) },
    { id: 'LD-106', name: 'Tanvi Joshi', email: 'tanvi.j@gmail.com', phone: '+91 98700 88990', source: 'Instagram', goal: 'Pilates & Tone', interestedPlan: 'Basic', status: 'Lost', assignedTo: 'Meera Iyer', followUp: iso(new Date(Date.now() - 86400000 * 4)), notes: 'Found location too far from office; might reconsider in summer.', createdAt: iso(new Date(Date.now() - 86400000 * 12)) },
    { id: 'LD-107', name: 'Gaurav Singhania', email: 'gaurav.s@corp.com', phone: '+91 98112 66778', source: 'Walk-in', goal: 'Strength & Bodybuilding', interestedPlan: 'Premium', status: 'Trial Scheduled', assignedTo: 'Arjun Kapoor', followUp: iso(new Date(Date.now() + 86400000 * 3)), notes: 'Trial workout booked for Friday 6:30 PM.', createdAt: iso(new Date(Date.now() - 86400000 * 2)) },
    { id: 'LD-108', name: 'Neha Chawla', email: 'neha.c@gmail.com', phone: '+91 98223 99001', source: 'Referral', goal: 'Post-Rehab Mobility', interestedPlan: 'Personal Training', status: 'Contacted', assignedTo: 'Priya Nair', followUp: iso(new Date(Date.now() + 86400000 * 2)), notes: 'Recovering from knee strain, needs guidance from certified trainer.', createdAt: iso(new Date(Date.now() - 86400000 * 6)) },
    { id: 'LD-109', name: 'Manish Verma', email: 'manish.v@rediff.com', phone: '+91 98330 11447', source: 'Google Search', goal: 'Cardio & Stamina', interestedPlan: 'Basic', status: 'Converted', assignedTo: 'Rohan Mehta', followUp: iso(new Date(Date.now() - 86400000 * 8)), notes: 'Completed trial session and enrolled into Basic plan.', createdAt: iso(new Date(Date.now() - 86400000 * 15)) }
  ],

  // GymArc Past Clients (Archive for Win-Back CRM & Re-enrollment)
  pastClients: [
    { id: 'GYM-2388', name: 'Rahul Varma', email: 'rahul.varma@mail.com', phone: '+91 98123 45671', previousPlan: 'Premium', fee: 5000, paid: 5000, trainer: 'Rohan Mehta', joined: '2025-11-10', leftDate: '2026-05-10', leaveReason: 'Plan Expired', notes: 'Completed 6-month goal. Receptive to win-back renewal promotion.', lifetimePaid: 10000, gender: 'Male' },
    { id: 'GYM-2391', name: 'Simran Kaur', email: 'simran.kaur@mail.com', phone: '+91 98234 56782', previousPlan: 'Standard', fee: 2700, paid: 2700, trainer: 'Ananya Sharma', joined: '2025-12-01', leftDate: '2026-03-01', leaveReason: 'Relocated', notes: 'Moved to north suburb; may return for weekend passes.', lifetimePaid: 5400, gender: 'Female' },
    { id: 'GYM-2394', name: 'Devendra Bhatia', email: 'dev.bhatia@mail.com', phone: '+91 98345 67893', previousPlan: 'Annual', fee: 9000, paid: 9000, trainer: 'Arjun Kapoor', joined: '2025-01-15', leftDate: '2026-01-15', leaveReason: 'Plan Expired', notes: 'Completed full annual membership. Interested in renewing with discount.', lifetimePaid: 18000, gender: 'Male' },
    { id: 'GYM-2396', name: 'Kavita Menon', email: 'kavita.m@mail.com', phone: '+91 98456 78904', previousPlan: 'Personal Training', fee: 4000, paid: 4000, trainer: 'Priya Nair', joined: '2026-01-05', leftDate: '2026-04-05', leaveReason: 'Medical / Injury', notes: 'Doctor recommended 2 months physical therapy; ready to resume now.', lifetimePaid: 12000, gender: 'Female' },
    { id: 'GYM-2398', name: 'Naveen Reddy', email: 'naveen.r@mail.com', phone: '+91 98567 89015', previousPlan: 'Basic', fee: 1000, paid: 1000, trainer: 'Meera Iyer', joined: '2026-02-12', leftDate: '2026-06-12', leaveReason: 'Pricing / Financial', notes: 'Paused due to semester exams and travel.', lifetimePaid: 4000, gender: 'Male' }
  ],

  // Workout Plans Templates
  workoutPlans: [
    { id: 'WP-1', name: 'Strength & Hypertrophy 4-Day Split', category: 'Muscle Building', duration: '8 Weeks', level: 'Intermediate', daysPerWeek: 4, exercises: 18, assignedCount: 9, description: 'Upper/Lower split focused on compound lifts, progressive overload, and functional strength.' },
    { id: 'WP-2', name: 'Fat Burn & HIIT Conditioning', category: 'Weight Loss', duration: '6 Weeks', level: 'All Levels', daysPerWeek: 5, exercises: 14, assignedCount: 6, description: 'High-intensity circuits combined with core strengthening and aerobic intervals.' },
    { id: 'WP-3', name: 'Beginner Foundation Routine', category: 'General Fitness', duration: '4 Weeks', level: 'Beginner', daysPerWeek: 3, exercises: 10, assignedCount: 8, description: 'Full body movement mastery, machine technique, and aerobic base building.' },
    { id: 'WP-4', name: 'Athletic Mobility & Core Power', category: 'Mobility & Rehab', duration: '6 Weeks', level: 'All Levels', daysPerWeek: 3, exercises: 12, assignedCount: 4, description: 'Joint flexibility, spine decompression, and deep core stability for injury prevention.' }
  ],

  // Diet Plans Templates
  dietPlans: [
    { id: 'DP-1', name: 'High-Protein Clean Bulk', calories: '2,800 kcal', protein: '165g', carbs: '320g', fats: '75g', type: 'Muscle Gain', assignedCount: 7, summary: 'Nutrient-dense whole grains, lean poultry/paneer, complex carbs and post-workout fuel.' },
    { id: 'DP-2', name: 'Lean Calorie Deficit & Macro Cut', calories: '1,950 kcal', protein: '150g', carbs: '160g', fats: '55g', type: 'Weight Loss', assignedCount: 8, summary: 'High-satiety greens, targeted protein intake, healthy fats and timed carbs around workouts.' },
    { id: 'DP-3', name: 'Vegetarian Performance Fuel', calories: '2,300 kcal', protein: '135g', carbs: '260g', fats: '65g', type: 'Balanced Nutrition', assignedCount: 5, summary: 'Lentil sprouts, soy/tofu, Greek yogurt, whey isolate, millets, nuts and seeds.' },
    { id: 'DP-4', name: 'Keto Metabolic Reset', calories: '2,100 kcal', protein: '125g', carbs: '30g', fats: '150g', type: 'Low Carb', assignedCount: 3, summary: 'Healthy avocados, eggs, cheese, olive oil, leafy greens and electrolyte optimization.' }
  ],

  payments: Array.from({ length: 30 }, (_, i) => ({
    id: `PAY-${String(8420 + i)}`,
    clientId: `GYM-${String(2401 + (i % 20)).slice(-4)}`,
    amount: [1000, 1350, 2700, 900, 5000, 1000][i % 6],
    method: ['UPI', 'Card', 'Cash', 'Bank transfer'][i % 4],
    date: iso(new Date(Date.now() - i * 86400000 * 2)),
    status: 'Paid',
    reference: `TXN${924510 + i}`
  })),

  expenses: Array.from({ length: 16 }, (_, i) => ({
    id: `EXP-${String(310 + i)}`,
    category: ['Rent', 'Utilities', 'Equipment', 'Staff salaries', 'Cleaning supplies', 'Marketing'][i % 6],
    description: ['Monthly facility rent', 'Electricity bill', 'Equipment maintenance', 'Team payroll', 'Facility supplies', 'Local campaign'][i % 6],
    amount: [45000, 8200, 12500, 38000, 2400, 6500][i % 6],
    date: iso(new Date(Date.now() - i * 86400000 * 3)),
    vendor: ['Prime Properties', 'BESCOM', 'FitPro Service', 'GymArc Payroll', 'CleanCo', 'Studio North'][i % 6],
    status: 'Approved'
  })),

  staff: Array.from({ length: 8 }, (_, i) => ({
    id: `ST-${String(31 + i)}`,
    name: ['Nisha Rao', 'Karan Shah', 'Amit Kumar', 'Riya Sen', 'Manoj Pillai', 'Sneha Das', 'Dev Malhotra', 'Pooja Nair'][i],
    role: ['Receptionist', 'Accounts Manager', 'Gym Assistant', 'Cleaning Staff', 'Maintenance Staff', 'Sales Staff', 'Gym Assistant', 'Receptionist'][i],
    status: 'Active'
  })),

  attendance: Array.from({ length: 18 }, (_, i) => ({
    id: i + 1,
    name: ['Aarav Patel', 'Diya Shah', 'Kabir Mehta', 'Isha Rao', 'Vivaan Singh', 'Anaya Iyer'][i % 6],
    date: iso(new Date(Date.now() - i * 86400000)),
    checkIn: '07:30 AM',
    status: i % 8 === 0 ? 'Late' : 'Present'
  })),

  schedules: [],
  announcements: [
    { id: 1, title: 'GymArc studio refresh this weekend', body: 'The strength studio has new equipment. Come try it out from Monday.', date: today, audience: 'All members', active: true }
  ],
  activities: [
    { title: 'System initialized', body: 'GymArc CRM initialized with member and pipeline records.', date: today }
  ]
};

function Provider({ children }) {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem('gymarc-data') || localStorage.getItem('forma-data');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...starter,
          ...parsed,
          leads: parsed.leads && parsed.leads.length ? parsed.leads : starter.leads,
          pastClients: parsed.pastClients && parsed.pastClients.length ? parsed.pastClients : starter.pastClients,
          workoutPlans: parsed.workoutPlans && parsed.workoutPlans.length ? parsed.workoutPlans : starter.workoutPlans,
          dietPlans: parsed.dietPlans && parsed.dietPlans.length ? parsed.dietPlans : starter.dietPlans
        };
      }
      return starter;
    } catch {
      return starter;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem('gymarc-session') || localStorage.getItem('forma-session') || 'null');
      if (u) {
        return {
          ...u,
          role: 'Admin',
          name: u.name || 'Alex Morgan',
          email: u.email || 'admin@gymdemo.com',
          phone: u.phone || '+91 98765 43210'
        };
      }
      return null;
    } catch {
      return null;
    }
  });

  const [dark, setDark] = useState(() => {
    return (localStorage.getItem('gymarc-dark') || localStorage.getItem('forma-dark')) === 'true';
  });

  useEffect(() => localStorage.setItem('gymarc-data', JSON.stringify(data)), [data]);
  useEffect(() => localStorage.setItem('gymarc-dark', dark), [dark]);

  const patch = (key, value) => setData(d => ({
    ...d,
    [key]: typeof value === 'function' ? value(d[key]) : value
  }));

  return (
    <Ctx.Provider value={{ data, setData, patch, user, setUser, dark, setDark }}>
      {children}
    </Ctx.Provider>
  );
}

const roleNav = {
  Admin: [
    ['CRM', 'Dashboard', 'Leads', 'Clients'],
    ['Operations', 'Membership plans', 'Payments', 'Payment schedules', 'Expenses', 'Reports', 'Invoices'],
    ['Fitness Programs', 'Workout plans', 'Diet plans', 'Trainers', 'Staff'],
    ['Engagement', 'Announcements', 'Notifications', 'Activity history'],
    ['System', 'Settings'],
    ['Archive', 'Past Clients']
  ]
};

const iconMap = {
  'Dashboard': LayoutDashboard,
  'Leads': UserPlus,
  'Clients': Users,
  'Past Clients': UserX,
  'Membership plans': ClipboardList,
  'Trainers': Dumbbell,
  'Staff': Users,
  'Payments': CreditCard,
  'Client payments': CreditCard,
  'Payment schedules': CalendarDays,
  'Expenses': Wallet,
  'Attendance': Activity,
  'Reports': FileText,
  'Financial reports': FileText,
  'Invoices': FileText,
  'Invoices & receipts': FileText,
  'Workout plans': Dumbbell,
  'Diet plans': Activity,
  'Announcements': Sparkles,
  'Notifications': Bell,
  'Activity history': Clock,
  'Settings': Settings,
  'My profile': Users,
  'My membership': ShieldCheck,
  'My payments': CreditCard,
  'Upcoming dues': CalendarDays,
  'My trainer': Dumbbell,
  'My workout plan': Dumbbell,
  'My diet plan': Activity,
  'My attendance': Activity,
  Feedback: CircleHelp,
  Profile: Users,
  'Outstanding payments': Wallet,
  'Overdue payments': Wallet
};

const appPages = [...new Set([
  ...roleNav.Admin.flatMap(([, ...links]) => links),
  'Client payments', 'Outstanding payments', 'Overdue payments', 'Invoices & receipts',
  'My workout plan', 'My diet plan'
])];

function Login() {
  const { setUser } = useGym(),
    [email, setEmail] = useState('admin@gymdemo.com'),
    [pass, setPass] = useState('admin123'),
    [error, setError] = useState('');

  const adminCreds = ['admin@gymdemo.com', 'admin123'];

  function submit(e) {
    e.preventDefault();
    if (email.trim().toLowerCase() === adminCreds[0] && pass === adminCreds[1]) {
      const u = {
        role: 'Admin',
        name: 'Alex Morgan',
        email: 'admin@gymdemo.com',
        phone: '+91 98765 43210',
        title: 'Super Administrator',
        gym: 'Northstar Fitness'
      };
      localStorage.setItem('gymarc-session', JSON.stringify(u));
      setUser(u);
    } else {
      setError('Invalid admin credentials. Use admin@gymdemo.com & admin123');
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-art">
        <div className="brand">
          <div className="brand-icon"><Activity size={20} /></div>
          GymArc<span className="brand-dot">.</span>
        </div>
        <div className="art-copy">
          <div className="eyebrow light"><span /> YOUR GYM CRM & MANAGEMENT</div>
          <h1>Stronger<br />operations.<br /><em>Better</em> outcomes.</h1>
          <p>One unified administrator console for member CRM, plans, financials, and retention momentum.</p>
        </div>
        <div className="art-bottom">
          <div className="art-stat">
            <strong>2.4k</strong><span>members managed</span>
          </div>
          <div className="avatar-stack">
            <i>AM</i><i>SK</i><i>JR</i><i>+8</i>
          </div>
        </div>
      </div>

      <div className="login-panel">
        <div className="mobile-brand brand">
          <div className="brand-icon"><Activity size={20} /></div>
          GymArc<span className="brand-dot">.</span>
        </div>
        <div className="login-content">
          <div className="eyebrow"><span /> ADMINISTRATOR PORTAL</div>
          <h2>Admin Sign in</h2>
          <p className="muted">Enter administrator credentials to access GymArc CRM.</p>

          <form onSubmit={submit}>
            <label>Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              placeholder="admin@gymdemo.com"
              required
            />
            <label>Password</label>
            <input
              type="password"
              value={pass}
              onChange={e => { setPass(e.target.value); setError(''); }}
              placeholder="Enter admin password"
              required
            />
            {error && <div className="error">{error}</div>}
            <button className="primary full" type="submit">Sign in as Admin <ChevronRight size={17} /></button>
          </form>

          <div
            className="demo-hint"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              setEmail('admin@gymdemo.com');
              setPass('admin123');
              setError('');
            }}
            title="Click to auto-fill admin credentials"
          >
            <ShieldCheck size={18} />
            <div>
              <b>Administrator Credentials (1-Click Fill)</b>
              <span>admin@gymdemo.com · admin123</span>
            </div>
          </div>
          <div className="login-foot">Administrator Security <span>·</span> Complete Gym CRM</div>
        </div>
      </div>
    </div>
  );
}

function Shell() {
  const { user, setUser, dark, setDark, data } = useGym();
  const navigate = useNavigate();
  const location = useLocation();
  const page = pageFromPath(location.pathname);
  const setPage = name => navigate(pagePath(name));
  const [collapsed, setCollapsed] = useState(false),
    [mobile, setMobile] = useState(false),
    [search, setSearch] = useState(''),
    [bell, setBell] = useState(false),
    [profileOpen, setProfileOpen] = useState(false);

  const menus = roleNav.Admin;

  function logout() {
    localStorage.removeItem('gymarc-session');
    localStorage.removeItem('forma-session');
    setUser(null);
  }

  return (
    <div className={`app ${dark ? 'dark' : ''}`}>
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobile ? 'mobile-open' : ''}`}>
        <div className="side-brand">
          <div className="brand-icon"><Activity size={19} /></div>
          {!collapsed && (
            <>
              <b>GymArc<span className="brand-dot">.</span></b>
              <button className="collapse-btn" onClick={() => setCollapsed(true)}>
                <ChevronLeft size={16} />
              </button>
            </>
          )}
        </div>

        <div className="gym-switch">
          <div className="gym-avatar">N</div>
          {!collapsed && (
            <div className="gym-name">
              <b>Northstar Fitness</b>
              <span>CRM Workspace</span>
            </div>
          )}
        </div>

        <nav>
          {menus.map(([heading, ...links]) => (
            <div className="nav-group" key={heading}>
              <div className="nav-heading">{!collapsed ? heading : ''}</div>
              {links.map(link => {
                const Icon = iconMap[link] || Activity;
                return (
                  <button
                    title={collapsed ? link : ''}
                    className={`nav-link ${page === link ? 'active' : ''}`}
                    onClick={() => { setPage(link); setMobile(false); }}
                    key={link}
                  >
                    <Icon size={17} />
                    {!collapsed && <span>{link}</span>}
                    {link === 'Notifications' && !collapsed && <i className="nav-count">3</i>}
                    {link === 'Leads' && !collapsed && (
                      <i className="nav-count" style={{ background: '#2d6148', color: '#d2eedc' }}>
                        {data.leads?.length || 9}
                      </i>
                    )}
                    {link === 'Past Clients' && !collapsed && (
                      <i className="nav-count" style={{ background: '#545f57', color: '#e5ece7' }}>
                        {data.pastClients?.length || 5}
                      </i>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="side-bottom">
          <div className="upgrade-card">
            <div className="upgrade-icon"><Zap size={16} /></div>
            {!collapsed && (
              <>
                <b>GymArc Pro</b>
                <span>Your gym CRM is running smoothly.</span>
                <button onClick={() => setPage('Settings')}>
                  CRM Settings <ChevronRight size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="top-left">
            <button className="mobile-menu" onClick={() => setMobile(!mobile)}><Menu /></button>
            {collapsed && (
              <button className="expand-btn" onClick={() => setCollapsed(false)}>
                <Menu size={18} />
              </button>
            )}
            <div className="crumb">
              <span>Northstar Fitness</span>
              <ChevronRight size={14} />
              <b>{page}</b>
            </div>
          </div>

          <div className="top-actions">
            <label className="search-top">
              <Search size={16} />
              <input placeholder="Search CRM..." value={search} onChange={e => setSearch(e.target.value)} />
              <kbd>⌘ K</kbd>
            </label>
            <button className="icon-button" onClick={() => setDark(!dark)} title="Toggle theme">
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="bell-wrap">
              <button className="icon-button" onClick={() => setBell(!bell)}>
                <Bell size={18} /><i />
              </button>
              {bell && (
                <div className="notification-pop">
                  <b>GymArc Notifications</b>
                  <p>3 memberships are due this week.</p>
                  <p>New trial scheduled for Pooja Hegde.</p>
                  <p>Payment received from Diya Shah.</p>
                </div>
              )}
            </div>
            <div className="top-divider" />
            <div className="top-user-wrap">
              <button
                className={`top-user ${profileOpen ? 'active' : ''}`}
                onClick={() => setProfileOpen(!profileOpen)}
                title="View Admin Profile Data"
              >
                <div className="profile-avatar small">{user.name.split(' ').map(x => x[0]).join('')}</div>
                <div><b>{user.name}</b><span>Administrator</span></div>
                <ChevronDown size={14} style={{ transform: profileOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>

              {profileOpen && (
                <>
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 55 }}
                    onClick={() => setProfileOpen(false)}
                  />
                  <div className="profile-dropdown-menu">
                    <div className="profile-dropdown-header">
                      <div className="profile-avatar large-avatar">
                        {user.name.split(' ').map(x => x[0]).join('')}
                      </div>
                      <div className="profile-dropdown-info">
                        <b>{user.name}</b>
                        <span className="profile-role-tag">Super Administrator</span>
                        <div className="profile-status-dot">
                          <span className="dot-pulse" /> Active Session
                        </div>
                      </div>
                    </div>

                    <div className="profile-dropdown-body">
                      <div className="profile-detail-item">
                        <Mail size={14} className="detail-icon" />
                        <div>
                          <small>Admin Email</small>
                          <span>{user.email || 'admin@gymdemo.com'}</span>
                        </div>
                      </div>
                      <div className="profile-detail-item">
                        <Phone size={14} className="detail-icon" />
                        <div>
                          <small>Admin Phone</small>
                          <span>{user.phone || '+91 98765 43210'}</span>
                        </div>
                      </div>
                      <div className="profile-detail-item">
                        <ShieldCheck size={14} className="detail-icon" />
                        <div>
                          <small>Role & Permissions</small>
                          <span>Full Administrator Access</span>
                        </div>
                      </div>
                      <div className="profile-detail-item">
                        <Users size={14} className="detail-icon" />
                        <div>
                          <small>Gym Branch</small>
                          <span>Northstar Fitness Main CRM</span>
                        </div>
                      </div>
                    </div>

                    <div className="profile-dropdown-actions">
                      <button
                        className="secondary"
                        style={{ height: 34, fontSize: 11, width: '100%', justifyContent: 'center' }}
                        onClick={() => {
                          setPage('Settings');
                          setProfileOpen(false);
                        }}
                      >
                        <Settings size={14} /> CRM Settings
                      </button>
                      <button
                        className="profile-logout-btn"
                        onClick={() => {
                          setProfileOpen(false);
                          logout();
                        }}
                      >
                        <LogOut size={15} /> Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <section className="content">
          <Routes>
            <Route path="/" element={<Page page="Dashboard" search={search} setPage={setPage} />} />
            {appPages.map(routePage => (
              <Route key={routePage} path={pagePath(routePage)} element={<Page page={routePage} search={search} setPage={setPage} />} />
            ))}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </section>
      </main>
    </div>
  );
}

const pagePath = page => `/${page.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
const pageFromPath = pathname => {
  const route = pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (!route) return 'Dashboard';
  const matchingPage = appPages.find(page => pagePath(page).slice(1) === route);
  return matchingPage || 'Dashboard';
};

function Page({ page, search, setPage }) {
  if (page === 'Dashboard') return <Dashboard role="Admin" setPage={setPage} />;
  if (page === 'Leads') return <Leads search={search} />;
  if (page === 'Past Clients') return <PastClients search={search} onReEnroll={() => setPage('Clients')} />;
  if (page === 'Clients' || page === 'Client payments' || page === 'Outstanding payments' || page === 'Overdue payments') {
    return <Clients page={page} search={search} setPage={setPage} />;
  }
  if (page === 'Membership plans') return <Plans setPage={setPage} />;
  if (page === 'Payments') return <Payments />;
  if (page === 'Expenses') return <Expenses />;
  if (page === 'Trainers' || page === 'Staff') return <People page={page} />;
  if (page === 'Payment schedules') return <Schedules />;
  if (page.toLowerCase().includes('report')) return <Reports />;
  if (page === 'Announcements') return <Announcements />;
  if (page === 'Invoices' || page === 'Invoices & receipts') return <Invoices />;
  if (page === 'Workout plans' || page === 'My workout plan') return <WorkoutPlans />;
  if (page === 'Diet plans' || page === 'My diet plan') return <DietPlans />;
  if (page === 'Activity history') return <ActivityHistory />;
  if (page === 'Settings') return <SettingsPage />;
  if (page === 'Notifications') return <Notifications />;
  return <GenericPage page={page} />;
}

function Heading({ eyebrow, title, sub, action }) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow"><span />{eyebrow}</div>
        <h1>{title}</h1>
        <p>{sub}</p>
      </div>
      {action}
    </div>
  );
}

function Dashboard({ role, setPage }) {
  const { data } = useGym();
  const isAccounts = role === 'Accounts';
  const clients = data.clients || [];
  const active = clients.filter(c => c.status === 'Active').length;
  const pastCount = (data.pastClients || []).length;
  const leadCount = (data.leads || []).length;
  const paid = (data.payments || []).reduce((a, p) => a + p.amount, 0);
  const outstanding = clients.reduce((a, c) => a + Math.max(c.fee - c.paid, 0), 0);
  const exp = (data.expenses || []).reduce((a, e) => a + e.amount, 0);

  const stats = isAccounts
    ? [
        ['Collected this month', money(paid), '↑ 12.8%', 'green', Wallet],
        ['Outstanding balance', money(outstanding), `${clients.filter(c => c.paid < c.fee).length} accounts`, 'amber', CreditCard],
        ['Overdue payments', money(clients.filter(c => c.payment === 'Overdue').reduce((a, c) => a + c.fee - c.paid, 0)), 'Needs follow-up', 'red', CalendarDays],
        ['Monthly expenses', money(exp), '↑ 4.2%', 'neutral', ArrowDownRight]
      ]
    : [
        ['Active members', active.toLocaleString(), `${Math.round((active / Math.max(1, clients.length)) * 100)}% active rate`, 'green', Users],
        ['CRM Leads', `${leadCount} leads`, `${data.leads?.filter(l => l.status === 'Trial Scheduled').length || 2} trials scheduled`, 'amber', UserPlus],
        ['Past clients', `${pastCount} archived`, 'Available for win-back', 'neutral', UserX],
        ['Monthly revenue', money(paid), '↑ 12.8% vs last month', 'green', Wallet]
      ];

  return (
    <>
      <Heading
        eyebrow={isAccounts ? 'FINANCE OVERVIEW' : new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}
        title={isAccounts ? 'Good morning, Maya' : 'GymArc CRM Dashboard'}
        sub={isAccounts ? 'Here’s how Northstar’s finances are looking today.' : 'Full visibility into leads pipeline, active members, past client retention, and cashflow.'}
        action={
          <div className="heading-actions">
            <button className="secondary" onClick={() => window.print()}>
              <Download size={16} /> Export overview
            </button>
            {!isAccounts && (
              <button className="primary" onClick={() => setPage && setPage('Leads')}>
                <UserPlus size={16} /> View Leads CRM
              </button>
            )}
          </div>
        }
      />

      <div className="stat-grid">
        {stats.map(([label, val, trend, tone, Icon]) => (
          <div className="stat-card" key={label}>
            <div className="stat-top">
              <span>{label}</span>
              <div className={`stat-icon ${tone}`}><Icon size={17} /></div>
            </div>
            <strong>{val}</strong>
            <div className={`stat-trend ${tone}`}><ArrowUpRight size={14} />{trend}</div>
          </div>
        ))}
      </div>

      <div className="chart-grid">
        <div className="panel revenue-panel">
          <div className="panel-head">
            <div>
              <h3>Revenue overview</h3>
              <span>Collected revenue · INR</span>
            </div>
            <select defaultValue="Last 6 months">
              <option>Last 6 months</option>
              <option>Last 12 months</option>
            </select>
          </div>
          <div className="chart-key">
            <i /> Revenue <i className="key-muted" /> Expenses <b>{money(paid)}</b><small>total collected</small>
          </div>
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData(data)} margin={{ top: 10, right: 8, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#437d63" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#437d63" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#eef0ed" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#89918c' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#89918c' }} tickFormatter={v => `${v / 1000}k`} />
                <Tooltip formatter={v => money(v)} />
                <Area type="monotone" dataKey="revenue" stroke="#477f64" strokeWidth={2.5} fill="url(#rev)" />
                <Area type="monotone" dataKey="expenses" stroke="#c8a66a" strokeWidth={2} fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel plan-panel">
          <div className="panel-head">
            <div>
              <h3>Membership mix</h3>
              <span>Active members by plan</span>
            </div>
            <button className="more-btn"><MoreHorizontal size={19} /></button>
          </div>
          <div className="plan-total">
            <b>{clients.length}</b><span>active members</span>
          </div>
          {data.plans.map((p, i) => {
            const n = clients.filter(c => c.plan === p.name).length;
            const pct = clients.length ? Math.round((n / clients.length) * 100) : 0;
            return (
              <div className="plan-row" key={p.id}>
                <div className={`plan-dot dot-${i % 5}`} />
                <div>
                  <b>{p.name}</b><span>{n} members</span>
                </div>
                <div className="progress">
                  <i style={{ width: `${Math.max(4, pct)}%` }} />
                </div>
                <strong>{pct}%</strong>
              </div>
            );
          })}
        </div>
      </div>

      <div className="lower-grid">
        <div className="panel activity-panel">
          <div className="panel-head">
            <div>
              <h3>Recent activity & CRM updates</h3>
              <span>Latest events across GymArc</span>
            </div>
            <button className="text-btn" onClick={() => setPage && setPage('Activity history')}>
              View all <ChevronRight size={15} />
            </button>
          </div>
          <div className="activity-list">
            {(data.activities?.length ? data.activities.slice(0, 4) : [
              { title: 'Payment received', body: 'Diya Shah completed her Standard membership payment', date: today },
              { title: 'New member joined', body: 'Aarav Patel joined the Premium plan', date: today },
              { title: 'Lead scheduled trial', body: 'Pooja Hegde scheduled personal training trial', date: today },
              { title: 'Membership renewed', body: 'Kabir Mehta renewed for 3 months', date: today }
            ]).map((act, idx) => (
              <div className="activity-item" key={idx}>
                <div className="activity-icon check">
                  <Check size={16} />
                </div>
                <div className="activity-copy">
                  <b>{act.title}</b>
                  <span>{act.body}</span>
                </div>
                <time>{act.date || today}</time>
              </div>
            ))}
          </div>
        </div>

        <div className="panel due-panel">
          <div className="panel-head">
            <div>
              <h3>Upcoming dues</h3>
              <span>Next 7 days</span>
            </div>
            <button className="text-btn" onClick={() => setPage && setPage('Outstanding payments')}>
              See all <ChevronRight size={15} />
            </button>
          </div>
          {clients.filter(c => c.payment !== 'Paid').slice(0, 4).map(c => (
            <div className="due-row" key={c.id}>
              <div className="person-avatar">{c.name.split(' ').map(x => x[0]).join('')}</div>
              <div className="due-name">
                <b>{c.name}</b><span>{c.plan} plan · {c.due}</span>
              </div>
              <strong>{money(c.fee - c.paid)}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="footer-note">
        <ShieldCheck size={14} /> GymArc CRM Demo Workspace · All data is stored on this device
      </div>
    </>
  );
}

function chartData(data) {
  return ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'].map((month, i) => ({
    month,
    revenue: Math.round(data.payments.reduce((a, p) => a + p.amount, 0) * (0.62 + i * 0.08)),
    expenses: Math.round(data.expenses.reduce((a, p) => a + p.amount, 0) * (0.68 + i * 0.055))
  }));
}

function Modal({ title, close, children }) {
  return (
    <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && close()}>
      <div className="modal">
        <div className="modal-head">
          <div>
            <h2>{title}</h2>
            <span>Enter the details below</span>
          </div>
          <button className="icon-button" onClick={close}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children || <input required />}
    </label>
  );
}

/* -------------------------------------------------------------
   CLIENTS MANAGEMENT COMPONENT (WITH REMOVE FROM PLAN & AUTO-FILL)
   ------------------------------------------------------------- */
function Clients({ page, search, setPage }) {
  const { data, patch } = useGym();
  const [enrollModal, setEnrollModal] = useState(false);
  const [removeModalClient, setRemoveModalClient] = useState(null);
  const [term, setTerm] = useState('');
  const [filter, setFilter] = useState('All status');
  const [selected, setSelected] = useState(null);
  const [sort, setSort] = useState('name');

  const q = (term || search).toLowerCase();

  const rows = (data.clients || []).filter(c =>
    `${c.name} ${c.id} ${c.email} ${c.phone}`.toLowerCase().includes(q) &&
    (filter === 'All status' || c.payment === filter || c.status === filter) &&
    (page === 'Outstanding payments' ? c.fee > c.paid : page === 'Overdue payments' ? c.payment === 'Overdue' : true)
  ).sort((a, b) => a[sort]?.localeCompare(b[sort]) || 0);

  return (
    <>
      <Heading
        eyebrow="MEMBER CRM MANAGEMENT"
        title={page === 'Clients' ? 'Clients' : page}
        sub="Manage active memberships, track payments, re-enroll past clients, or remove members from plans."
        action={
          <div className="heading-actions">
            <button className="secondary" onClick={() => exportExcel(data.clients, 'gymarc-clients')}>
              <Download size={15} /> Export Excel
            </button>
            <button className="primary" onClick={() => setEnrollModal(true)}>
              <Plus size={16} /> Add client / Re-enroll
            </button>
          </div>
        }
      />

      <div className="list-stats">
        <span><b>{rows.length}</b> members shown</span>
        <span><b>{data.clients.filter(c => c.status === 'Active').length}</b> active members</span>
        <span><b>{data.clients.filter(c => c.custom).length}</b> custom fee plans</span>
        <span><b>{data.pastClients?.length || 0}</b> past clients in archive</span>
      </div>

      <div className="panel table-panel">
        <div className="table-toolbar">
          <label className="table-search">
            <Search size={16} />
            <input placeholder="Search name, ID, phone or email" value={term} onChange={e => setTerm(e.target.value)} />
          </label>
          <div className="toolbar-actions">
            <select value={filter} onChange={e => setFilter(e.target.value)}>
              <option>All status</option>
              <option>Active</option>
              <option>Paid</option>
              <option>Partial</option>
              <option>Pending</option>
              <option>Overdue</option>
            </select>
            <button className="secondary" onClick={() => setSort(sort === 'name' ? 'fee' : 'name')}>
              <SlidersHorizontal size={15} /> Sort
            </button>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>MEMBER <button onClick={() => setSort('name')}>↕</button></th>
                <th>MEMBER ID</th>
                <th>MEMBERSHIP</th>
                <th>TRAINER</th>
                <th>FEE / PAID</th>
                <th>NEXT DUE</th>
                <th>PAYMENT STATUS</th>
                <th>FEE REMINDER</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(c => (
                <tr key={c.id}>
                  <td>
                    <div className="person-cell">
                      <div className="person-avatar">{c.name.split(' ').map(x => x[0]).join('')}</div>
                      <div>
                        <b>{c.name}</b>
                        <span>{c.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="id-cell">{c.id}</td>
                  <td>
                    <b>{c.plan}</b>
                    {c.custom && <span className="mini-tag">Custom fee</span>}
                  </td>
                  <td>{c.trainer}</td>
                  <td>
                    <b>{money(c.fee)}</b>
                    <span className="sub-cell">{money(c.paid)} paid</span>
                  </td>
                  <td>{c.due}</td>
                  <td>
                    <span className={`status ${c.payment.toLowerCase()}`}>{c.payment}</span>
                  </td>
                  <td>
                    <div className="mail-actions">
                      <input type="email" aria-label={`Reminder email for ${c.name}`} defaultValue={c.email} />
                      <button
                        className="mail-send"
                        type="button"
                        disabled={c.paid >= c.fee}
                        onClick={e => {
                          const to = e.currentTarget.parentElement.querySelector('input').value.trim();
                          if (to) {
                            const subject = `Membership fee reminder · GymArc`;
                            const body = `Hello ${c.name}, this is a friendly reminder that ${money(Math.max(0, c.fee - c.paid))} is due for your ${c.plan} membership on ${c.due}. If you have already paid, please disregard this note. — Northstar Fitness GymArc`;
                            window.location.href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                          }
                        }}
                      >
                        Send
                      </button>
                    </div>
                  </td>
                  <td>
                    <button className="more-btn" title="Member actions" onClick={() => setSelected(c)}>
                      <Ellipsis size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '36px 0', color: 'var(--muted)' }}>
                    No members found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-foot">
          Showing <b>{rows.length}</b> of <b>{data.clients.length}</b> members
          <div>
            <button><ChevronLeft size={15} /></button>
            <button className="current-page">1</button>
            <button><ChevronRight size={15} /></button>
          </div>
        </div>
      </div>

      {/* Past Clients Archive Callout at Bottom */}
      <div className="panel past-clients-bottom-card" style={{ marginTop: 18, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 9, background: '#eef2ee', color: '#315c47', display: 'grid', placeItems: 'center' }}>
            <UserX size={18} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Past Clients Archive</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>
              <b>{data.pastClients?.length || 0}</b> past members archived · Re-enroll anytime or review former client records
            </div>
          </div>
        </div>
        <button
          className="secondary"
          onClick={() => setPage && setPage('Past Clients')}
          style={{ height: 34, fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <UserX size={14} /> Open Past Clients Archive <ChevronRight size={14} />
        </button>
      </div>

      {/* Add Client / Re-enroll Modal (with Past Client Search) */}
      {enrollModal && (
        <EnrollClientModal
          close={() => setEnrollModal(false)}
        />
      )}

      {/* Remove Client from Plan Modal */}
      {removeModalClient && (
        <RemoveClientModal
          client={removeModalClient}
          close={() => setRemoveModalClient(null)}
        />
      )}

      {/* Member Details & Actions Modal (Opened from Three Dots ...) */}
      {selected && (
        <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="modal">
            <div className="modal-head">
              <div>
                <h2>{selected.name}</h2>
                <span>Member ID: {selected.id} · Membership Actions</span>
              </div>
              <button className="icon-button" onClick={() => setSelected(null)}><X size={18} /></button>
            </div>

            <div className="modal-body">
              <div className="detail-card">
                <div className="person-avatar large">
                  {selected.name.split(' ').map(x => x[0]).join('')}
                </div>
                <div>
                  <span>{selected.id} · {selected.email} · {selected.phone}</span>
                  <h3>{selected.plan} Membership</h3>
                  <p>{money(selected.paid)} paid of {money(selected.fee)} · Next due: {selected.due} · Expires: {selected.expiry}</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '18px 0' }}>
                <button
                  type="button"
                  className="action-pill danger"
                  style={{ height: 44, padding: '0 16px', fontSize: 12, justifyContent: 'flex-start', borderRadius: 8, width: '100%' }}
                  onClick={() => {
                    const c = selected;
                    setSelected(null);
                    setRemoveModalClient(c);
                  }}
                >
                  <UserX size={17} style={{ marginRight: 10, flexShrink: 0 }} />
                  <div style={{ textAlign: 'left' }}>
                    <b>Remove from plan & Move to Past Clients</b>
                    <div style={{ fontSize: 10, opacity: 0.85 }}>Cancel active plan and archive record to Past Clients</div>
                  </div>
                </button>

                <button
                  type="button"
                  className="secondary"
                  style={{ height: 42, justifyContent: 'flex-start', padding: '0 16px', borderRadius: 8, width: '100%' }}
                  onClick={() => {
                    patch('clients', a => a.map(c => c.id === selected.id ? { ...c, status: c.status === 'Active' ? 'Inactive' : 'Active' } : c));
                    setSelected(null);
                  }}
                >
                  <ShieldCheck size={16} style={{ marginRight: 10, flexShrink: 0 }} />
                  <span>{selected.status === 'Active' ? 'Deactivate member temporarily' : 'Reactivate member account'}</span>
                </button>
              </div>

              <div className="modal-actions">
                <button type="button" className="secondary" onClick={() => setSelected(null)}>Cancel</button>
                <button type="button" className="primary" onClick={() => setSelected(null)}>Done</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function generatePDFInvoice(client, payment) {
  import('jspdf').then(({ jsPDF }) => {
    const doc = new jsPDF();
    const primary = [49, 92, 71]; // #315c47 GymArc Dark Green

    // Header Banner
    doc.setFillColor(...primary);
    doc.rect(0, 0, 210, 32, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('NORTHSTAR FITNESS', 18, 16);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('GYMARC CRM & FITNESS MANAGEMENT', 18, 24);

    // Invoice Title
    doc.setFontSize(13);
    doc.text('OFFICIAL TAX INVOICE & RECEIPT', 210 - 18, 20, { align: 'right' });

    // Invoice Metadata
    doc.setTextColor(50, 60, 55);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Invoice No: INV-${payment.id}`, 18, 44);
    doc.setFont('helvetica', 'normal');
    doc.text(`Payment Date: ${payment.date}`, 18, 51);
    doc.text(`Payment Mode: ${payment.method}`, 18, 58);
    doc.text(`Transaction Ref: ${payment.reference || 'N/A'}`, 18, 65);

    // Gym Info (Right aligned)
    doc.text('Northstar Fitness Flagship Hub', 210 - 18, 44, { align: 'right' });
    doc.text('100 Feet Road, Indiranagar', 210 - 18, 51, { align: 'right' });
    doc.text('Bengaluru, Karnataka - 560038', 210 - 18, 58, { align: 'right' });
    doc.text('GSTIN: 29AABCU9603R1ZM · admin@gymdemo.com', 210 - 18, 65, { align: 'right' });

    // Divider Line
    doc.setDrawColor(220, 225, 222);
    doc.line(18, 72, 210 - 18, 72);

    // Billed To Section
    doc.setFont('helvetica', 'bold');
    doc.text('BILLED TO (MEMBER):', 18, 81);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${client.name}`, 18, 89);
    doc.text(`Member ID: ${client.id}`, 18, 96);
    doc.text(`Email: ${client.email}`, 18, 103);
    doc.text(`Contact: ${client.phone}`, 18, 110);

    // Membership Info
    doc.setFont('helvetica', 'bold');
    doc.text('MEMBERSHIP DETAILS:', 110, 81);
    doc.setFont('helvetica', 'normal');
    doc.text(`Plan Name: ${client.plan}`, 110, 89);
    doc.text(`Account Status: ${client.status}`, 110, 96);
    doc.text(`Next Due Date: ${client.due || 'N/A'}`, 110, 103);
    doc.text(`Expiry Date: ${client.expiry || 'Active'}`, 110, 110);

    // Table Header
    doc.setFillColor(242, 246, 243);
    doc.rect(18, 120, 210 - 36, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(36, 44, 39);
    doc.text('DESCRIPTION / PARTICULARS', 22, 126);
    doc.text('TOTAL PLAN FEE', 105, 126);
    doc.text('AMOUNT PAID', 210 - 22, 126, { align: 'right' });

    // Table Row
    doc.setFont('helvetica', 'normal');
    doc.text(`${client.plan} Gym Membership Fee (${payment.period || 'Current Term'})`, 22, 138);
    doc.text(`₹${Number(client.fee || 0).toLocaleString('en-IN')}`, 105, 138);
    doc.setFont('helvetica', 'bold');
    doc.text(`₹${Number(payment.amount || 0).toLocaleString('en-IN')}`, 210 - 22, 138, { align: 'right' });

    // Line under items
    doc.setDrawColor(220, 225, 222);
    doc.line(18, 146, 210 - 36, 146);

    // Summary Box
    const remaining = Math.max(0, (client.fee || 0) - (client.paid || 0));
    doc.setFont('helvetica', 'normal');
    doc.text('Amount Received in this Transaction:', 120, 156);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`₹${Number(payment.amount || 0).toLocaleString('en-IN')}`, 210 - 22, 156, { align: 'right' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Remaining Balance Due:', 120, 164);
    doc.setFont('helvetica', 'bold');
    doc.text(`₹${remaining.toLocaleString('en-IN')}`, 210 - 22, 164, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.text('Payment Clearance Status:', 120, 172);
    doc.setFont('helvetica', 'bold');
    doc.text(`${remaining <= 0 ? 'PAID IN FULL' : 'PARTIAL PAYMENT'}`, 210 - 22, 172, { align: 'right' });

    // Footer notes
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 130, 125);
    doc.text('Note: This is an authentic digital tax invoice & receipt generated by GymArc CRM.', 18, 198);
    doc.text('For questions regarding this receipt, please contact accounts@gymdemo.com or +91 98765 43210.', 18, 204);
    doc.text('Thank you for training with Northstar Fitness!', 18, 210);

    doc.save(`Invoice-${payment.id}.pdf`);
  });
}

export function sendInvoiceEmail(client, payment, recipientEmail) {
  const to = (recipientEmail || client.email || '').trim();
  if (!to) {
    alert('Please enter a valid recipient email address.');
    return false;
  }
  const remaining = Math.max(0, (client.fee || 0) - (client.paid || 0));
  const subject = `Payment Receipt & Tax Invoice #${payment.id} — Northstar Fitness GymArc`;
  const body = `Dear ${client.name},

Thank you for your payment! Here are the official payment receipt and tax invoice details for your gym membership at Northstar Fitness.

=======================================================
TAX INVOICE & PAYMENT RECEIPT
=======================================================
Invoice / Receipt ID : ${payment.id}
Date of Payment      : ${payment.date}
Payment Method       : ${payment.method}
Transaction Ref      : ${payment.reference || 'N/A'}
Billing Period       : ${payment.period || 'Current Term'}

-------------------------------------------------------
MEMBER DETAILS
-------------------------------------------------------
Member Name          : ${client.name}
Member ID            : ${client.id}
Membership Plan      : ${client.plan}
Registered Email     : ${client.email}
Phone                : ${client.phone}

-------------------------------------------------------
PAYMENT & BALANCE BREAKDOWN
-------------------------------------------------------
Total Plan Fee       : ₹${Number(client.fee || 0).toLocaleString('en-IN')}
Amount Paid Now      : ₹${Number(payment.amount || 0).toLocaleString('en-IN')}
Remaining Balance    : ₹${remaining.toLocaleString('en-IN')}
Payment Status       : ${remaining <= 0 ? 'PAID IN FULL' : 'PARTIAL PAYMENT'}
Next Due Date        : ${client.due || 'N/A'}

=======================================================
Facility Location: Northstar Fitness Hub, Indiranagar, Bengaluru
Contact Support  : admin@gymdemo.com | +91 98765 43210

Thank you for being part of Northstar Fitness!
`;

  window.location.href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return true;
}

function Payments() {
  const { data, patch } = useGym(),
    [modal, setModal] = useState(false),
    [term, setTerm] = useState(''),
    [selectedClientId, setSelectedClientId] = useState(''),
    [invoiceModal, setInvoiceModal] = useState(null),
    [toast, setToast] = useState(null);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3800);
  }

  // Find currently selected client for payment recording
  const selectedClient = data.clients.find(x => x.id === selectedClientId) ||
    data.clients.find(x => x.paid < x.fee) ||
    data.clients[0];

  function openRecordModal() {
    const defaultClient = data.clients.find(x => x.paid < x.fee) || data.clients[0];
    if (defaultClient) {
      setSelectedClientId(defaultClient.id);
    }
    setModal(true);
  }

  function save(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const clientId = f.get('client');
    const c = data.clients.find(x => x.id === clientId);
    const amt = Number(f.get('amount'));
    const recipientEmail = (f.get('invoiceEmail') || c?.email || '').trim();
    const autoSend = f.get('autoSend') === 'on';

    if (!c || amt <= 0 || amt > c.fee - c.paid) {
      return alert(`Enter an amount between ₹1 and ₹${Math.max(0, (c?.fee || 0) - (c?.paid || 0))}`);
    }

    const p = {
      id: `PAY-${Date.now().toString().slice(-6)}`,
      clientId: c.id,
      amount: amt,
      method: f.get('method'),
      date: f.get('date'),
      period: f.get('period') || `${new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })}`,
      status: 'Paid',
      reference: f.get('reference') || `TXN${Date.now().toString().slice(-8)}`
    };

    // Save payment
    patch('payments', a => [p, ...a]);
    patch('clients', a => a.map(x => x.id === c.id ? {
      ...x,
      paid: x.paid + amt,
      payment: x.paid + amt >= x.fee ? 'Paid' : 'Partial'
    } : x));
    patch('activities', a => [
      {
        title: 'Payment received & Invoice generated',
        body: `${c.name} paid ${money(amt)} by ${p.method} (Invoice #${p.id})`,
        date: today
      },
      ...a
    ]);

    setModal(false);

    // Open Invoice Generator Modal for the client
    setInvoiceModal({ payment: p, client: { ...c, paid: c.paid + amt }, recipientEmail });

    // If autoSend is checked, dispatch email immediately
    if (autoSend && recipientEmail) {
      sendInvoiceEmail({ ...c, paid: c.paid + amt }, p, recipientEmail);
      showToast(`Payment saved! Tax Invoice #${p.id} emailed to ${c.name} (${recipientEmail}).`);
    } else {
      showToast(`Payment saved! Tax Invoice #${p.id} generated for ${c.name}.`);
    }
  }

  const payments = (data.payments || []).filter(p => {
    const c = data.clients.find(x => x.id === p.clientId);
    return `${p.id} ${c?.name} ${c?.email} ${p.method}`.toLowerCase().includes(term.toLowerCase());
  });

  return (
    <>
      <Heading
        eyebrow="FINANCIAL TRANSACTIONS"
        title="Payments"
        sub="Record incoming payments, generate tax invoices, and email verified receipts to members."
        action={
          <button className="primary" onClick={openRecordModal}>
            <Plus size={16} /> Record payment
          </button>
        }
      />

      <div className="stat-grid compact-stats">
        {[
          ['Total Collected', money(data.payments.reduce((a, p) => a + p.amount, 0))],
          ['Open Balances', money(data.clients.reduce((a, c) => a + Math.max(0, c.fee - c.paid), 0))],
          ['Transactions', data.payments.length],
          ['Overdue Accounts', data.clients.filter(c => c.payment === 'Overdue').length]
        ].map(([a, b]) => (
          <div className="stat-card" key={a}>
            <div className="stat-top">
              <span>{a}</span>
              <div className="stat-icon green"><Wallet size={16} /></div>
            </div>
            <strong>{b}</strong>
          </div>
        ))}
      </div>

      <div className="panel table-panel">
        <div className="table-toolbar">
          <label className="table-search">
            <Search size={16} />
            <input
              placeholder="Search payment ID, member name, email..."
              value={term}
              onChange={e => setTerm(e.target.value)}
            />
          </label>
          <button className="secondary" onClick={() => exportExcel(data.payments, 'gymarc-payments')}>
            <Download size={15} /> Export Excel
          </button>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>INVOICE / RECEIPT</th>
                <th>MEMBER</th>
                <th>PAYMENT DATE</th>
                <th>METHOD</th>
                <th>REFERENCE</th>
                <th>AMOUNT</th>
                <th>STATUS</th>
                <th style={{ textAlign: 'right' }}>INVOICE & EMAIL</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => {
                const c = data.clients.find(x => x.id === p.clientId) || {
                  name: 'Member',
                  id: p.clientId,
                  email: 'member@example.com',
                  phone: 'N/A',
                  fee: p.amount,
                  paid: p.amount,
                  plan: 'Membership'
                };
                return (
                  <tr key={p.id}>
                    <td className="id-cell">
                      <b>{p.id}</b>
                      <span className="sub-cell">INV-{p.id}</span>
                    </td>
                    <td>
                      <b>{c.name}</b>
                      <span className="sub-cell">{c.email}</span>
                    </td>
                    <td>{p.date}</td>
                    <td><span className="mini-tag">{p.method}</span></td>
                    <td className="id-cell">{p.reference}</td>
                    <td><b>{money(p.amount)}</b></td>
                    <td><span className="status paid">Paid</span></td>
                    <td>
                      <div className="invoice-actions-group" style={{ justifyContent: 'flex-end' }}>
                        <button
                          className="action-btn-invoice"
                          onClick={() => setInvoiceModal({ payment: p, client: c, recipientEmail: c.email })}
                          title="Generate & View Invoice"
                        >
                          <FileText size={13} /> Invoice
                        </button>
                        <button
                          className="action-btn-invoice primary-mail"
                          onClick={() => {
                            sendInvoiceEmail(c, p, c.email);
                            showToast(`Invoice email draft opened for ${c.name} (${c.email})`);
                          }}
                          title={`Email invoice to ${c.email}`}
                        >
                          <Mail size={13} /> Email
                        </button>
                        <button
                          className="action-btn-invoice"
                          onClick={() => {
                            generatePDFInvoice(c, p);
                            showToast(`PDF Tax Invoice downloaded for ${c.name}`);
                          }}
                          title="Download PDF Invoice"
                        >
                          <Download size={13} /> PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px 0', color: 'var(--muted)' }}>
                    No payment records found matching your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="table-foot">Showing <b>{payments.length}</b> transactions with invoice generation enabled</div>
      </div>

      {/* RECORD PAYMENT MODAL (WITH EMAIL INVOICE GENERATOR TOGGLE) */}
      {modal && (
        <Modal title="Record Member Payment & Generate Invoice" close={() => setModal(false)}>
          <form className="modal-form" onSubmit={save}>
            {/* Member Selector & Summary Card */}
            <div style={{ marginBottom: 16 }}>
              <Field label="Select Member">
                <select
                  name="client"
                  value={selectedClient?.id || ''}
                  onChange={e => setSelectedClientId(e.target.value)}
                  required
                >
                  {data.clients.map(c => {
                    const bal = Math.max(0, c.fee - c.paid);
                    return (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.id}) · {c.plan} — {bal > 0 ? `${money(bal)} balance due` : 'Paid in full'}
                      </option>
                    );
                  })}
                </select>
              </Field>

              {selectedClient && (
                <div style={{ marginTop: 10, padding: '12px 14px', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
                      {selectedClient.name} <span style={{ fontWeight: 400, color: 'var(--muted)' }}>({selectedClient.plan} Plan)</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Mail size={12} /> {selectedClient.email} · {selectedClient.phone}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>Remaining Due</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: selectedClient.fee > selectedClient.paid ? '#c5493b' : '#315c47' }}>
                      {money(Math.max(0, selectedClient.fee - selectedClient.paid))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="form-grid">
              <Field label="Payment Amount (₹)">
                <input
                  name="amount"
                  type="number"
                  min="1"
                  max={Math.max(1, (selectedClient?.fee || 0) - (selectedClient?.paid || 0))}
                  defaultValue={Math.max(1000, (selectedClient?.fee || 0) - (selectedClient?.paid || 0))}
                  required
                />
              </Field>
              <Field label="Payment Date">
                <input name="date" type="date" defaultValue={today} required />
              </Field>
              <Field label="Payment Method">
                <select name="method" defaultValue="UPI">
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank transfer">Bank Transfer / IMPS</option>
                  <option value="Card">Debit / Credit Card</option>
                  <option value="Other">Other</option>
                </select>
              </Field>
              <Field label="Transaction Reference No.">
                <input name="reference" placeholder={`e.g. UPI${Date.now().toString().slice(-6)}`} />
              </Field>
              <Field label="Billing Period">
                <input
                  name="period"
                  defaultValue={`${new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })}`}
                />
              </Field>
              <Field label="Recipient Email for Invoice">
                <input
                  name="invoiceEmail"
                  type="email"
                  defaultValue={selectedClient?.email || ''}
                  placeholder="client@example.com"
                  required
                />
              </Field>
            </div>

            {/* Invoice & Email Dispatch Option Box */}
            <div style={{ marginTop: 16, padding: '12px 14px', background: '#eaf4ee', border: '1px solid #b3dbc0', borderRadius: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, fontWeight: 600, color: '#214e34', cursor: 'pointer' }}>
                <input type="checkbox" name="autoSend" defaultChecked style={{ width: 16, height: 16, accentColor: '#315c47' }} />
                <span>Automatically generate and send tax invoice to client email upon saving</span>
              </label>
              <div style={{ fontSize: 10, color: '#3f6d50', marginTop: 4, paddingLeft: 26 }}>
                Includes official receipt number, breakdown of total plan fee, paid amount, and remaining balance.
              </div>
            </div>

            <div className="modal-actions">
              <button className="secondary" type="button" onClick={() => setModal(false)}>Cancel</button>
              <button className="primary" type="submit">
                <FileText size={16} /> Confirm Payment & Generate Invoice
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* INTERACTIVE INVOICE GENERATOR & EMAIL DISPATCH MODAL */}
      {invoiceModal && (
        <Modal
          title={`Tax Invoice & Payment Receipt #${invoiceModal.payment.id}`}
          close={() => setInvoiceModal(null)}
        >
          <div className="modal-body" style={{ padding: '16px 22px' }}>
            {/* Visual Invoice Card */}
            <div className="invoice-card">
              <div className="invoice-header-banner">
                <div>
                  <h2>NORTHSTAR FITNESS</h2>
                  <span>GymArc CRM & Member Billing System</span>
                </div>
                <div className="invoice-badge-receipt">
                  <div>RECEIPT #{invoiceModal.payment.id}</div>
                  <div style={{ fontSize: 9, opacity: 0.85, fontWeight: 400 }}>INV-{invoiceModal.payment.id}</div>
                </div>
              </div>

              <div className="invoice-body">
                <div className="invoice-grid">
                  <div>
                    <div className="invoice-section-title">Billed To (Member)</div>
                    <div className="invoice-detail-row"><span>Name:</span><b>{invoiceModal.client.name}</b></div>
                    <div className="invoice-detail-row"><span>Member ID:</span><b>{invoiceModal.client.id}</b></div>
                    <div className="invoice-detail-row"><span>Email:</span><b>{invoiceModal.recipientEmail || invoiceModal.client.email}</b></div>
                    <div className="invoice-detail-row"><span>Phone:</span><b>{invoiceModal.client.phone}</b></div>
                  </div>
                  <div>
                    <div className="invoice-section-title">Payment Particulars</div>
                    <div className="invoice-detail-row"><span>Payment Date:</span><b>{invoiceModal.payment.date}</b></div>
                    <div className="invoice-detail-row"><span>Payment Method:</span><b>{invoiceModal.payment.method}</b></div>
                    <div className="invoice-detail-row"><span>Transaction Ref:</span><b>{invoiceModal.payment.reference || 'N/A'}</b></div>
                    <div className="invoice-detail-row"><span>Membership Plan:</span><b>{invoiceModal.client.plan}</b></div>
                  </div>
                </div>

                {/* Itemized Table */}
                <table className="invoice-table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Total Plan Fee</th>
                      <th>Amount Paid Now</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <b>{invoiceModal.client.plan} Gym Membership</b>
                        <div style={{ fontSize: 9, color: 'var(--muted)' }}>Billing Period: {invoiceModal.payment.period || 'Current Term'}</div>
                      </td>
                      <td>{money(invoiceModal.client.fee)}</td>
                      <td><b>{money(invoiceModal.payment.amount)}</b></td>
                    </tr>
                  </tbody>
                </table>

                {/* Summary Totals */}
                <div className="invoice-summary-box">
                  <div>
                    <span className="status paid" style={{ fontSize: 10, padding: '4px 10px' }}>
                      {Math.max(0, invoiceModal.client.fee - invoiceModal.client.paid) <= 0 ? '✓ Paid in Full' : 'Partial Payment'}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>Total Amount Paid in this Receipt:</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>
                      {money(invoiceModal.payment.amount)}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
                      Remaining Balance: <b>{money(Math.max(0, invoiceModal.client.fee - invoiceModal.client.paid))}</b>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Email Dispatch Action Bar */}
            <div className="invoice-email-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>
                <Mail size={16} /> Send to:
              </div>
              <input
                id="invoiceEmailInput"
                type="email"
                defaultValue={invoiceModal.recipientEmail || invoiceModal.client.email}
                placeholder="client@example.com"
              />
              <button
                className="action-btn-invoice primary-mail"
                style={{ height: 34, padding: '0 14px', fontSize: 11 }}
                onClick={() => {
                  const inputVal = document.getElementById('invoiceEmailInput')?.value || invoiceModal.client.email;
                  sendInvoiceEmail(invoiceModal.client, invoiceModal.payment, inputVal);
                  showToast(`Invoice #${invoiceModal.payment.id} dispatched to ${inputVal}!`);
                }}
              >
                <Send size={13} /> Send Invoice Email
              </button>
            </div>

            {/* PDF, Print and Close Actions */}
            <div className="modal-actions" style={{ marginTop: 14 }}>
              <button
                className="secondary"
                type="button"
                onClick={() => {
                  generatePDFInvoice(invoiceModal.client, invoiceModal.payment);
                  showToast(`PDF Tax Invoice #${invoiceModal.payment.id} downloaded.`);
                }}
              >
                <Download size={14} /> Download PDF
              </button>
              <button
                className="secondary"
                type="button"
                onClick={() => window.print()}
              >
                <Printer size={14} /> Print
              </button>
              <button className="primary" onClick={() => setInvoiceModal(null)}>
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Floating Action Toast Notification */}
      {toast && (
        <div className="toast-msg">
          <CheckCircle2 size={16} style={{ color: '#82d39b' }} />
          <span>{toast}</span>
        </div>
      )}
    </>
  );
}

function Plans({ setPage }) {
  const { data, patch } = useGym(),
    [modal, setModal] = useState(false),
    [editing, setEditing] = useState(null),
    [deletePlan, setDeletePlan] = useState(null),
    [viewMembersPlan, setViewMembersPlan] = useState(null),
    [removeClient, setRemoveClient] = useState(null),
    [search, setSearch] = useState(''),
    [statusFilter, setStatusFilter] = useState('All'),
    [durationFilter, setDurationFilter] = useState('All'),
    [viewMode, setViewMode] = useState('cards'),
    [toast, setToast] = useState(null),
    [selectedFacilities, setSelectedFacilities] = useState([]);

  const defaultFacilityOptions = [
    'Gym floor access',
    'Locker room & showers',
    'Group fitness classes',
    'Steam room & Sauna',
    'Personal trainer evaluation',
    'Custom diet consultation',
    'Cardio zone',
    'Free guest pass'
  ];

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  function openCreate() {
    setEditing(null);
    setSelectedFacilities(['Gym floor access', 'Locker room & showers', 'Group fitness classes']);
    setModal(true);
  }

  function openEdit(p) {
    setEditing(p);
    setSelectedFacilities(p.facilities || ['Gym floor access', 'Locker room & showers']);
    setModal(true);
  }

  function toggleFacility(f) {
    setSelectedFacilities(prev =>
      prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]
    );
  }

  function submit(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const planName = f.get('name').trim();
    const duration = f.get('duration').trim();
    const months = Number(f.get('months')) || 1;
    const price = Number(f.get('price')) || 0;
    const status = f.get('status') || 'Active';
    const training = f.get('training') || 'Optional';
    const description = f.get('description') || `${planName} membership with access to GymArc facilities`;
    const facilities = selectedFacilities.length > 0
      ? selectedFacilities
      : ['Gym floor access', 'Locker room & showers', 'Group fitness classes'];

    if (editing) {
      const oldName = editing.name;
      const updatedPlan = {
        ...editing,
        name: planName,
        duration,
        months,
        price,
        status,
        training,
        description,
        facilities
      };
      patch('plans', a => a.map(x => x.id === editing.id ? updatedPlan : x));
      if (oldName !== planName) {
        patch('clients', a => a.map(c => c.plan === oldName ? { ...c, plan: planName } : c));
      }
      showToast(`Plan "${planName}" updated successfully!`);
    } else {
      const newPlan = {
        id: `PL-${Date.now().toString().slice(-5)}`,
        name: planName,
        duration,
        months,
        price,
        status,
        training,
        description,
        facilities
      };
      patch('plans', a => [...a, newPlan]);
      showToast(`Plan "${planName}" created successfully!`);
    }
    setModal(false);
    setEditing(null);
  }

  function confirmDelete() {
    if (!deletePlan) return;
    const name = deletePlan.name;
    patch('plans', a => a.filter(x => x.id !== deletePlan.id));
    showToast(`Plan "${name}" deleted from catalog.`);
    setDeletePlan(null);
  }

  const filteredPlans = (data.plans || []).filter(p => {
    const q = search.toLowerCase();
    const matchesSearch = !q || p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q) || (p.facilities || []).some(f => f.toLowerCase().includes(q));
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    const matchesDuration = durationFilter === 'All' || String(p.months) === durationFilter;
    return matchesSearch && matchesStatus && matchesDuration;
  });

  const totalMembers = (data.clients || []).length;
  const activePlansCount = (data.plans || []).filter(p => p.status === 'Active').length;
  const avgPrice = Math.round((data.plans || []).reduce((a, p) => a + (p.price || 0), 0) / Math.max(1, (data.plans || []).length));

  return (
    <>
      <Heading
        eyebrow="MEMBERSHIP MANAGEMENT"
        title="Membership plans"
        sub="Create, update, and manage member catalog plans, pricing, amenities, and enrollments."
        action={
          <button className="primary" onClick={openCreate}>
            <Plus size={16} /> Create plan
          </button>
        }
      />

      {/* Plans Metric Summary Bar */}
      <div className="stat-grid compact-stats">
        {[
          ['Total Plans', (data.plans || []).length, `${activePlansCount} active`, 'green', ClipboardList],
          ['Active Plans', activePlansCount, 'In public catalog', 'green', ShieldCheck],
          ['Average Plan Price', money(avgPrice), 'Catalog mean', 'amber', CreditCard],
          ['Enrolled Members', totalMembers, 'Across all plans', 'neutral', Users]
        ].map(([title, val, note, tone, Icon]) => (
          <div className="stat-card" key={title}>
            <div className="stat-top">
              <span>{title}</span>
              <div className={`stat-icon ${tone}`}><Icon size={16} /></div>
            </div>
            <strong>{val}</strong>
            <div className={`stat-trend ${tone}`}>{note}</div>
          </div>
        ))}
      </div>

      {/* Toolbar with Search, Status, Duration, View Mode & Create */}
      <div className="plans-toolbar">
        <div className="plans-filter-group">
          <label className="table-search" style={{ width: 230 }}>
            <Search size={15} />
            <input
              placeholder="Search plan name, perk..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </label>
          <select
            className="status-select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="All">All statuses</option>
            <option value="Active">Active only</option>
            <option value="Inactive">Inactive only</option>
          </select>
          <select
            className="status-select"
            value={durationFilter}
            onChange={e => setDurationFilter(e.target.value)}
          >
            <option value="All">All durations</option>
            <option value="1">1 Month</option>
            <option value="3">3 Months</option>
            <option value="6">6 Months</option>
            <option value="12">12 Months</option>
          </select>
        </div>

        <div className="plans-filter-group">
          <div className="view-mode-toggle">
            <button
              className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
              title="Card Grid View"
            >
              <Grid size={14} /> Cards
            </button>
            <button
              className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <List size={14} /> Table
            </button>
          </div>
        </div>
      </div>

      {/* View Mode: Cards */}
      {viewMode === 'cards' && (
        <div className="plan-cards">
          {filteredPlans.map((p, i) => {
            const enrolled = (data.clients || []).filter(c => c.plan === p.name);
            const monthlyRate = Math.round(p.price / Math.max(1, p.months));
            return (
              <article className="panel plan-card" key={p.id}>
                <div className={`plan-card-icon p-${i % 5}`}><Dumbbell size={19} /></div>
                <div className="plan-card-top">
                  <span className={`status ${p.status === 'Active' ? 'paid' : 'inactive'}`}>{p.status}</span>
                  <div className="plan-card-actions">
                    <button
                      className="plan-icon-btn"
                      onClick={() => openEdit(p)}
                      title="Edit Plan"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      className="plan-icon-btn delete-btn"
                      onClick={() => setDeletePlan(p)}
                      title="Delete Plan"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <h3>{p.name}</h3>
                <p>{p.description}</p>

                <div className="plan-training-badge">
                  <Zap size={12} /> Personal Training: {p.training || 'Optional'}
                </div>

                <div className="plan-price">
                  <strong>{money(p.price)}</strong>
                  <span>/ {p.duration} ({money(monthlyRate)}/mo)</span>
                </div>

                <div className="plan-feature">
                  {(p.facilities || []).slice(0, 4).map((x, j) => (
                    <span key={j}><Check size={14} />{x}</span>
                  ))}
                  {(p.facilities || []).length > 4 && (
                    <span style={{ color: 'var(--muted)', fontSize: 9 }}>
                      +{p.facilities.length - 4} more amenities
                    </span>
                  )}
                </div>

                <div className="plan-card-foot">
                  <div className="avatar-stack mini">
                    {enrolled.slice(0, 3).map(c => <i key={c.id}>{c.name.split(' ').map(x => x[0]).join('')}</i>)}
                    {enrolled.length > 3 && <i>+{enrolled.length - 3}</i>}
                  </div>
                  <span style={{ cursor: 'pointer' }} onClick={() => setViewMembersPlan(p)}>
                    <b>{enrolled.length}</b> enrolled (Manage)
                  </span>
                  <button onClick={() => openEdit(p)}>
                    Edit <ChevronRight size={14} />
                  </button>
                </div>
              </article>
            );
          })}
          {filteredPlans.length === 0 && (
            <div className="panel empty-state" style={{ gridColumn: '1 / -1' }}>
              <div className="empty-icon"><ClipboardList size={24} /></div>
              <h3>No membership plans found</h3>
              <p>Try adjusting your search query or create a new plan.</p>
              <button className="primary" style={{ marginTop: 14 }} onClick={openCreate}>
                <Plus size={15} /> Create Plan
              </button>
            </div>
          )}
        </div>
      )}

      {/* View Mode: Table */}
      {viewMode === 'table' && (
        <div className="panel table-panel">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>PLAN NAME & ID</th>
                  <th>DURATION</th>
                  <th>PRICE</th>
                  <th>TRAINING</th>
                  <th>AMENITIES</th>
                  <th>STATUS</th>
                  <th>ENROLLED</th>
                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlans.map(p => {
                  const enrolled = (data.clients || []).filter(c => c.plan === p.name);
                  return (
                    <tr key={p.id}>
                      <td>
                        <b>{p.name}</b>
                        <span className="id-cell">{p.id}</span>
                      </td>
                      <td><b>{p.duration}</b> <span className="sub-cell">{p.months} month(s)</span></td>
                      <td><b>{money(p.price)}</b> <span className="sub-cell">{money(Math.round(p.price / Math.max(1, p.months)))}/mo</span></td>
                      <td><span className="mini-tag">{p.training || 'Optional'}</span></td>
                      <td>
                        <span style={{ fontSize: 10 }}>{(p.facilities || []).slice(0, 2).join(', ')}</span>
                        {(p.facilities || []).length > 2 && (
                          <span className="sub-cell">+{p.facilities.length - 2} more</span>
                        )}
                      </td>
                      <td>
                        <span className={`status ${p.status === 'Active' ? 'paid' : 'inactive'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="action-pill"
                          onClick={() => setViewMembersPlan(p)}
                          title="View enrolled members"
                        >
                          <b>{enrolled.length}</b> members
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                          <button
                            className="plan-icon-btn"
                            onClick={() => openEdit(p)}
                            title="Edit plan"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            className="plan-icon-btn delete-btn"
                            onClick={() => setDeletePlan(p)}
                            title="Delete plan"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="table-foot">
            Showing <b>{filteredPlans.length}</b> of <b>{data.plans.length}</b> plans
          </div>
        </div>
      )}

      {/* CREATE & EDIT MODAL */}
      {modal && (
        <Modal
          title={editing ? `Edit Plan: ${editing.name}` : 'Create New Membership Plan'}
          close={() => { setModal(false); setEditing(null); }}
        >
          <form className="modal-form" onSubmit={submit}>
            <div className="form-grid">
              <Field label="Plan Name">
                <input
                  name="name"
                  defaultValue={editing?.name}
                  placeholder="e.g. Standard Fitness, Gold Annual"
                  required
                />
              </Field>
              <Field label="Duration Label">
                <input
                  name="duration"
                  defaultValue={editing?.duration || '3 months'}
                  placeholder="e.g. 1 month, 3 months, 12 months"
                  required
                />
              </Field>
              <Field label="Duration in Months">
                <input
                  name="months"
                  type="number"
                  defaultValue={editing?.months || 3}
                  min="1"
                  max="36"
                  required
                />
              </Field>
              <Field label="Price (₹)">
                <input
                  name="price"
                  type="number"
                  defaultValue={editing?.price || 2500}
                  min="0"
                  step="50"
                  required
                />
              </Field>
              <Field label="Status">
                <select name="status" defaultValue={editing?.status || 'Active'}>
                  <option value="Active">Active (Available in catalog)</option>
                  <option value="Inactive">Inactive (Hidden)</option>
                </select>
              </Field>
              <Field label="Personal Training">
                <select name="training" defaultValue={editing?.training || 'Optional'}>
                  <option value="Included">Included in plan</option>
                  <option value="Optional">Optional add-on</option>
                  <option value="Not Included">Not Included</option>
                </select>
              </Field>
            </div>

            <div style={{ marginTop: 14 }}>
              <Field label="Plan Description">
                <input
                  name="description"
                  defaultValue={editing?.description || 'Full access to gym floor and facilities.'}
                  placeholder="Brief summary of plan highlights"
                  required
                />
              </Field>
            </div>

            {/* Included Amenities Checklist */}
            <div style={{ marginTop: 16 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Included Amenities & Facilities
              </span>
              <div className="facility-tags">
                {defaultFacilityOptions.map(f => {
                  const selected = selectedFacilities.includes(f);
                  return (
                    <button
                      key={f}
                      type="button"
                      className={`facility-tag-btn ${selected ? 'selected' : ''}`}
                      onClick={() => toggleFacility(f)}
                    >
                      <Check size={12} style={{ opacity: selected ? 1 : 0.35 }} />
                      {f}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => { setModal(false); setEditing(null); }}
              >
                Cancel
              </button>
              <button className="primary" type="submit">
                {editing ? 'Update Plan' : 'Create Plan'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletePlan && (
        <Modal
          title={`Delete Plan: ${deletePlan.name}`}
          close={() => setDeletePlan(null)}
        >
          <div className="modal-body">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, background: '#fdf3f2', border: '1px solid #f9d5d1', padding: 16, borderRadius: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: '#f8d2cf', color: '#b93f31', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <AlertTriangle size={18} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <b style={{ color: '#b93f31', fontSize: 13 }}>Are you sure you want to delete this plan?</b>
                <p style={{ margin: '4px 0 0', fontSize: 11, color: '#684541', lineHeight: 1.45 }}>
                  This action will permanently delete <b>"{deletePlan.name}" ({money(deletePlan.price)})</b> from the membership catalog.
                </p>
                {data.clients.filter(c => c.plan === deletePlan.name).length > 0 && (
                  <p style={{ margin: '8px 0 0', fontSize: 10, fontWeight: 600, color: '#a83224' }}>
                    ⚠️ Note: {data.clients.filter(c => c.plan === deletePlan.name).length} member(s) are currently enrolled in this plan.
                  </p>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setDeletePlan(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="action-pill danger"
                style={{ height: 36, padding: '0 16px', fontSize: 11 }}
                onClick={confirmDelete}
              >
                <Trash2 size={14} /> Confirm Delete Plan
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* VIEW ENROLLED MEMBERS MODAL */}
      {viewMembersPlan && (
        <Modal
          title={`Enrolled Members in ${viewMembersPlan.name}`}
          close={() => setViewMembersPlan(null)}
        >
          <div className="modal-body">
            <div className="table-scroll" style={{ maxHeight: 350, margin: '6px 0 16px' }}>
              <table>
                <thead>
                  <tr>
                    <th>MEMBER</th>
                    <th>PHONE</th>
                    <th>PAID / FEE</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {data.clients.filter(c => c.plan === viewMembersPlan.name).map(c => (
                    <tr key={c.id}>
                      <td><b>{c.name}</b><span className="sub-cell">{c.id}</span></td>
                      <td>{c.phone}</td>
                      <td>{money(c.paid)} / {money(c.fee)}</td>
                      <td>
                        <button
                          className="action-pill danger"
                          onClick={() => {
                            setViewMembersPlan(null);
                            setRemoveClient(c);
                          }}
                        >
                          <UserX size={12} /> Remove from plan
                        </button>
                      </td>
                    </tr>
                  ))}
                  {data.clients.filter(c => c.plan === viewMembersPlan.name).length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>
                        No members currently enrolled in this plan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="modal-actions">
              <button className="primary" onClick={() => setViewMembersPlan(null)}>Done</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Remove Client from Plan Modal (moves to Past Clients) */}
      {removeClient && (
        <RemoveClientModal client={removeClient} close={() => setRemoveClient(null)} />
      )}

      {/* Floating Action Toast Notification */}
      {toast && (
        <div className="toast-msg">
          <CheckCircle2 size={16} style={{ color: '#82d39b' }} />
          <span>{toast}</span>
        </div>
      )}
    </>
  );
}

function Expenses() {
  const { data, patch } = useGym(),
    [modal, setModal] = useState(false),
    [term, setTerm] = useState('');

  function save(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      x = {
        id: `EXP-${Date.now().toString().slice(-5)}`,
        category: f.get('category'),
        description: f.get('description'),
        amount: Number(f.get('amount')),
        date: f.get('date'),
        vendor: f.get('vendor'),
        status: 'Approved'
      };
    patch('expenses', a => [x, ...a]);
    setModal(false);
  }

  return (
    <>
      <Heading
        eyebrow="COST CONTROL"
        title="Expenses"
        sub="Keep the day-to-day running costs in view."
        action={<button className="primary" onClick={() => setModal(true)}><Plus size={16} /> Add expense</button>}
      />
      <div className="stat-grid compact-stats">
        {[
          ['Total expenses', money(data.expenses.reduce((a, e) => a + e.amount, 0))],
          ['This month', money(data.expenses.filter(e => e.date.slice(0, 7) === today.slice(0, 7)).reduce((a, e) => a + e.amount, 0))],
          ['Expense records', data.expenses.length],
          ['Net collected', money(data.payments.reduce((a, p) => a + p.amount, 0) - data.expenses.reduce((a, e) => a + e.amount, 0))]
        ].map(([a, b]) => (
          <div className="stat-card" key={a}>
            <div className="stat-top"><span>{a}</span><div className="stat-icon amber"><Wallet size={16} /></div></div>
            <strong>{b}</strong>
          </div>
        ))}
      </div>
      <div className="panel table-panel">
        <div className="table-toolbar">
          <label className="table-search">
            <Search size={16} />
            <input placeholder="Search expenses" value={term} onChange={e => setTerm(e.target.value)} />
          </label>
          <button className="secondary" onClick={() => exportExcel(data.expenses, 'expenses')}><Download size={15} /> Export</button>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>EXPENSE</th><th>CATEGORY</th><th>DATE</th><th>VENDOR</th><th>AMOUNT</th><th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {data.expenses.filter(e => `${e.description} ${e.category} ${e.vendor}`.toLowerCase().includes(term.toLowerCase())).map(e => (
                <tr key={e.id}>
                  <td><b>{e.description}</b><span className="sub-cell">{e.id}</span></td>
                  <td>{e.category}</td>
                  <td>{e.date}</td>
                  <td>{e.vendor}</td>
                  <td><b>{money(e.amount)}</b></td>
                  <td><span className="status paid">{e.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {modal && (
        <Modal title="Add an expense" close={() => setModal(false)}>
          <form className="modal-form" onSubmit={save}>
            <div className="form-grid">
              <Field label="Description"><input name="description" required /></Field>
              <Field label="Category">
                <select name="category">
                  {['Rent', 'Electricity', 'Equipment', 'Maintenance', 'Staff salaries', 'Trainer salaries', 'Cleaning supplies', 'Marketing', 'Software subscriptions', 'Miscellaneous'].map(x => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </Field>
              <Field label="Amount (₹)"><input name="amount" type="number" min="1" required /></Field>
              <Field label="Date"><input name="date" type="date" defaultValue={today} required /></Field>
              <Field label="Vendor"><input name="vendor" required /></Field>
              <Field label="Payment method">
                <select name="method">
                  <option>Bank transfer</option><option>UPI</option><option>Cash</option><option>Card</option>
                </select>
              </Field>
            </div>
            <div className="modal-actions">
              <button type="button" className="secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="primary">Save expense</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

function People({ page }) {
  const { data } = useGym(),
    list = page === 'Trainers' ? data.trainers : data.staff;

  return (
    <>
      <Heading
        eyebrow="YOUR TEAM"
        title={page}
        sub={page === 'Trainers' ? 'The people who make every member’s progress possible.' : 'Your team and gym staff, all in one place.'}
        action={<button className="primary"><Plus size={16} /> Add {page === 'Trainers' ? 'trainer' : 'staff member'}</button>}
      />
      <div className="team-grid">
        {list.map(p => (
          <div className="panel team-card" key={p.id}>
            <div className="person-avatar large">{p.initials || p.name.split(' ').map(x => x[0]).join('')}</div>
            <button className="more-btn"><Ellipsis size={18} /></button>
            <h3>{p.name}</h3>
            <span>{p.specialty || p.role}</span>
            <div className="team-meta">
              {page === 'Trainers' ? `${p.experience} experience · ${p.clients} clients` : `${p.id} · ${p.status}`}
            </div>
            <button className="secondary">View profile <ChevronRight size={14} /></button>
          </div>
        ))}
      </div>
    </>
  );
}

function Schedules() {
  const { data } = useGym();
  const clients = data.clients.filter(c => c.paid < c.fee);
  return (
    <>
      <Heading eyebrow="PAYMENT PLANNING" title="Payment schedules" sub="Upcoming member payments, at a glance." />
      <div className="panel table-panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>MEMBER</th><th>MEMBERSHIP</th><th>INSTALLMENT</th><th>DUE DATE</th><th>PAID</th><th>REMAINING</th><th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(c => (
                <tr key={c.id}>
                  <td><b>{c.name}</b><span className="sub-cell">{c.id}</span></td>
                  <td>{c.plan}</td>
                  <td>{money(c.fee)}</td>
                  <td>{c.due}</td>
                  <td>{money(c.paid)}</td>
                  <td><b>{money(c.fee - c.paid)}</b></td>
                  <td><span className={`status ${c.payment.toLowerCase()}`}>{c.payment}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function Reports() {
  const { data } = useGym();

  function pdf() {
    try {
      import('jspdf').then(({ jsPDF }) => {
        const d = new jsPDF();
        d.text('GymArc · Northstar Fitness financial summary', 14, 18);
        d.text(`Collected revenue: ${money(data.payments.reduce((a, p) => a + p.amount, 0))}`, 14, 32);
        d.text(`Expenses: ${money(data.expenses.reduce((a, e) => a + e.amount, 0))}`, 14, 42);
        d.text(`Outstanding: ${money(data.clients.reduce((a, c) => a + c.fee - c.paid, 0))}`, 14, 52);
        d.save('gymarc-financial-report.pdf');
      });
    } catch {
      window.print();
    }
  }

  return (
    <>
      <Heading
        eyebrow="INSIGHTS & ANALYTICS"
        title="Reports"
        sub="A grounded view of the numbers that matter."
        action={
          <div className="heading-actions">
            <button className="secondary" onClick={() => exportExcel(data.payments, 'financial-report')}>
              <Download size={15} /> Excel
            </button>
            <button className="primary" onClick={pdf}>
              <FileText size={15} /> Download PDF
            </button>
          </div>
        }
      />
      <div className="report-grid">
        <div className="panel report-card">
          <span>COLLECTED REVENUE</span>
          <strong>{money(data.payments.reduce((a, p) => a + p.amount, 0))}</strong>
          <small><ArrowUpRight size={14} /> From confirmed payments</small>
        </div>
        <div className="panel report-card">
          <span>OPERATING EXPENSES</span>
          <strong>{money(data.expenses.reduce((a, p) => a + p.amount, 0))}</strong>
          <small>Across {data.expenses.length} recorded expenses</small>
        </div>
        <div className="panel report-card">
          <span>NET OPERATING RESULT</span>
          <strong>{money(data.payments.reduce((a, p) => a + p.amount, 0) - data.expenses.reduce((a, p) => a + p.amount, 0))}</strong>
          <small>Collected revenue less expenses</small>
        </div>
        <div className="panel report-chart">
          <div className="panel-head">
            <div>
              <h3>Revenue & expenses</h3>
              <span>Monthly operating overview</span>
            </div>
          </div>
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData(data)}>
                <CartesianGrid vertical={false} stroke="#eef0ed" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={v => `${v / 1000}k`} />
                <Tooltip formatter={v => money(v)} />
                <Bar dataKey="revenue" fill="#477f64" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#d5c19b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}

function App() {
  const { user } = useGym();
  return user ? <Shell /> : <Login />;
}

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Provider>
      <App />
    </Provider>
  </BrowserRouter>
);
