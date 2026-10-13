import React, { useContext, useState, useMemo } from 'react';
import { Download, Plus, Check, FileText, Sparkles, X, ChevronRight, Bell, Activity, ShieldCheck, CalendarDays, Dumbbell, Users, UserPlus, UserCheck, UserX, RotateCcw, Phone, Mail, MessageSquare, Search, Trash2, Clock, Filter, SlidersHorizontal, ArrowUpRight, Zap, ChevronLeft } from 'lucide-react';
import { Ctx } from './main.jsx';

const useGym = () => useContext(Ctx);
const money = n => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const today = new Date().toISOString().slice(0, 10);

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

/* -------------------------------------------------------------
   ENROLL CLIENT MODAL WITH SEARCH-WISE PAST CLIENT LOOKUP
   ------------------------------------------------------------- */
export function EnrollClientModal({ close, initialData, onComplete }) {
  const { data, patch } = useGym();
  const [pastSearch, setPastSearch] = useState('');
  const [selectedPast, setSelectedPast] = useState(null);
  const [convertingLead, setConvertingLead] = useState(initialData?.fromLeadId ? initialData : null);

  const [form, setForm] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    plan: initialData?.plan || data.plans[0]?.name || 'Standard',
    fee: initialData?.fee || '',
    paid: initialData?.paid || 0,
    trainer: initialData?.trainer || data.trainers[0]?.name || '',
    due: today,
    expiry: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
    gender: 'Female'
  });

  // If initialData specifically has fromPastClientId, pre-select that past client
  React.useEffect(() => {
    if (initialData?.fromPastClientId) {
      const past = (data.pastClients || []).find(p => p.id === initialData.fromPastClientId);
      if (past) {
        selectPastClient(past);
      }
    }
  }, [initialData]);

  // Autocomplete search across past clients
  const filteredPast = useMemo(() => {
    if (!pastSearch.trim()) return [];
    const q = pastSearch.toLowerCase();
    return (data.pastClients || []).filter(p =>
      (p.name?.toLowerCase().includes(q) ||
       p.phone?.toLowerCase().includes(q) ||
       p.email?.toLowerCase().includes(q) ||
       p.previousPlan?.toLowerCase().includes(q))
    ).slice(0, 5);
  }, [pastSearch, data.pastClients]);

  function selectPastClient(past) {
    setSelectedPast(past);
    setPastSearch('');
    const planObj = data.plans.find(p => p.name === past.previousPlan) || data.plans[0];
    setForm(f => ({
      ...f,
      name: past.name,
      email: past.email,
      phone: past.phone,
      plan: past.previousPlan || planObj?.name || 'Standard',
      fee: planObj ? planObj.price : f.fee,
      trainer: past.trainer || f.trainer,
      gender: past.gender || f.gender
    }));
  }

  function clearSelectedPast() {
    setSelectedPast(null);
    setForm(f => ({ ...f, name: '', email: '', phone: '' }));
  }

  function handlePlanChange(e) {
    const planName = e.target.value;
    const planObj = data.plans.find(p => p.name === planName);
    setForm(f => ({
      ...f,
      plan: planName,
      fee: planObj ? planObj.price : f.fee
    }));
  }

  function submit(e) {
    e.preventDefault();
    const planObj = data.plans.find(p => p.name === form.plan);
    const agreedFee = Number(form.fee || planObj?.price || 0);
    const initialPaid = Number(form.paid || 0);
    const newId = selectedPast?.id || `GYM-${String(2401 + (data.clients?.length || 0)).slice(-4)}`;

    const newClient = {
      id: newId,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      plan: form.plan,
      fee: agreedFee,
      standardFee: planObj?.price || agreedFee,
      paid: initialPaid,
      status: 'Active',
      payment: initialPaid >= agreedFee ? 'Paid' : initialPaid > 0 ? 'Partial' : 'Pending',
      due: form.due,
      expiry: form.expiry,
      trainer: form.trainer,
      joined: today,
      custom: agreedFee !== (planObj?.price || agreedFee),
      gender: form.gender,
      previousPaid: selectedPast ? (selectedPast.lifetimePaid || 0) : 0
    };

    // If re-enrolling from past clients:
    if (selectedPast) {
      patch('pastClients', list => (list || []).filter(p => p.id !== selectedPast.id));
      patch('clients', list => [newClient, ...(list || []).filter(c => c.id !== newClient.id)]);
      patch('activities', list => [{
        title: 'Past client re-enrolled',
        body: `${newClient.name} re-enrolled into ${newClient.plan} plan`,
        date: today
      }, ...(list || [])]);
    }
    // If converting from a lead:
    else if (convertingLead) {
      patch('leads', list => (list || []).map(l => l.id === convertingLead.fromLeadId ? { ...l, status: 'Converted' } : l));
      patch('clients', list => [newClient, ...(list || [])]);
      patch('activities', list => [{
        title: 'Lead converted to member',
        body: `${newClient.name} converted to ${newClient.plan} plan`,
        date: today
      }, ...(list || [])]);
    }
    // Regular new client:
    else {
      patch('clients', list => [newClient, ...(list || [])]);
      patch('activities', list => [{
        title: 'New member joined',
        body: `${newClient.name} joined the ${newClient.plan} plan`,
        date: today
      }, ...(list || [])]);
    }

    // Record initial payment if greater than 0
    if (initialPaid > 0) {
      patch('payments', list => [{
        id: `PAY-${Date.now().toString().slice(-6)}`,
        clientId: newClient.id,
        amount: initialPaid,
        method: 'UPI',
        date: today,
        status: 'Paid',
        reference: `ENROLL${Date.now().toString().slice(-6)}`
      }, ...(list || [])]);
    }

    if (onComplete) onComplete(newClient);
    close();
  }

  return (
    <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && close()}>
      <div className="modal">
        <div className="modal-head">
          <div>
            <h2>{selectedPast ? `Re-enroll: ${selectedPast.name}` : convertingLead ? `Convert Lead: ${convertingLead.name}` : 'Enroll New Member'}</h2>
            <span>{selectedPast ? 'Re-activating past client record with a new membership' : 'Enter client details or select a past member to re-enroll'}</span>
          </div>
          <button className="icon-button" onClick={close}><X size={18} /></button>
        </div>

        <form className="modal-form" onSubmit={submit}>
          {/* SEARCH-WISE PAST CLIENT LOOKUP */}
          {!convertingLead && (
            <div className="past-lookup-box">
              <div className="past-lookup-head">
                <span>RE-ENROLLING A PAST MEMBER? SEARCH PAST CLIENTS</span>
                {(data.pastClients?.length || 0) > 0 && (
                  <span className="muted">{data.pastClients.length} past clients in archive</span>
                )}
              </div>
              <div className="past-lookup-input">
                <Search size={15} className="muted" />
                <input
                  type="text"
                  placeholder="Type name, phone or email to auto-fill from past clients..."
                  value={pastSearch}
                  onChange={e => setPastSearch(e.target.value)}
                />
                {pastSearch && (
                  <button type="button" className="more-btn" onClick={() => setPastSearch('')}>
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Autocomplete dropdown */}
              {filteredPast.length > 0 && (
                <div className="past-lookup-results">
                  {filteredPast.map(p => (
                    <div key={p.id} className="past-lookup-item" onClick={() => selectPastClient(p)}>
                      <div>
                        <b>{p.name}</b> <span className="muted">· {p.phone} · {p.email}</span>
                      </div>
                      <div>
                        <span className="source-tag">{p.previousPlan}</span>
                        <span className="muted" style={{ marginLeft: 8 }}>Left: {p.leftDate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedPast && (
                <div className="re-enroll-banner">
                  <div>
                    <RotateCcw size={14} style={{ display: 'inline', marginRight: 6 }} />
                    <b>Auto-filled from Past Client:</b> {selectedPast.name} ({selectedPast.id}) · Left: {selectedPast.leftDate} ({selectedPast.leaveReason})
                  </div>
                  <button type="button" className="action-pill danger" onClick={clearSelectedPast}>
                    <X size={12} /> Clear selection
                  </button>
                </div>
              )}
            </div>
          )}

          {convertingLead && (
            <div className="re-enroll-banner" style={{ gridColumn: '1 / -1', marginBottom: 12 }}>
              <div>
                <UserCheck size={15} style={{ display: 'inline', marginRight: 6 }} />
                <b>Converting Lead:</b> {convertingLead.name} · Source: {convertingLead.source || 'CRM'} · Goal: {convertingLead.goal}
              </div>
            </div>
          )}

          <div className="form-grid">
            <label className="field">
              <span>Full name</span>
              <input
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Rahul Sharma"
              />
            </label>

            <label className="field">
              <span>Email address</span>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="client@email.com"
              />
            </label>

            <label className="field">
              <span>Phone number</span>
              <input
                required
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98 7654 3210"
              />
            </label>

            <label className="field">
              <span>Membership plan</span>
              <select value={form.plan} onChange={handlePlanChange}>
                {data.plans.map(p => (
                  <option key={p.id} value={p.name}>{p.name} ({money(p.price)} / {p.duration})</option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Agreed fee (₹)</span>
              <input
                type="number"
                min="0"
                value={form.fee}
                onChange={e => setForm({ ...form, fee: e.target.value })}
                placeholder="Uses plan price"
              />
            </label>

            <label className="field">
              <span>Initial payment (₹)</span>
              <input
                type="number"
                min="0"
                value={form.paid}
                onChange={e => setForm({ ...form, paid: e.target.value })}
              />
            </label>

            <label className="field">
              <span>Assigned trainer</span>
              <select value={form.trainer} onChange={e => setForm({ ...form, trainer: e.target.value })}>
                {data.trainers.map(t => (
                  <option key={t.id} value={t.name}>{t.name} ({t.specialty})</option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Next payment due</span>
              <input
                type="date"
                value={form.due}
                onChange={e => setForm({ ...form, due: e.target.value })}
              />
            </label>

            <label className="field">
              <span>Membership expiry</span>
              <input
                type="date"
                value={form.expiry}
                onChange={e => setForm({ ...form, expiry: e.target.value })}
              />
            </label>

            <label className="field">
              <span>Gender</span>
              <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="secondary" onClick={close}>Cancel</button>
            <button type="submit" className="primary">
              {selectedPast ? 'Re-enroll client' : convertingLead ? 'Convert to member' : 'Add member'} <ChevronRight size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------
   REMOVE CLIENT FROM PLAN MODAL (MOVES CLIENT TO PAST CLIENTS)
   ------------------------------------------------------------- */
export function RemoveClientModal({ client, close }) {
  const { patch } = useGym();
  const [reason, setReason] = useState('Plan Expired');
  const [leftDate, setLeftDate] = useState(today);
  const [notes, setNotes] = useState('');

  function confirmRemove(e) {
    e.preventDefault();
    if (!client) return;

    const pastRecord = {
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      previousPlan: client.plan,
      fee: client.fee,
      paid: client.paid,
      trainer: client.trainer,
      joined: client.joined,
      leftDate: leftDate,
      leaveReason: reason,
      notes: notes || `Removed from ${client.plan} plan on ${leftDate}. Reason: ${reason}.`,
      lifetimePaid: Number(client.paid || 0) + Number(client.previousPaid || 0),
      gender: client.gender || 'Not specified',
      status: 'Past Client'
    };

    // 1. Remove from active clients
    patch('clients', list => (list || []).filter(c => c.id !== client.id));

    // 2. Add to past clients
    patch('pastClients', list => [pastRecord, ...(list || []).filter(p => p.id !== client.id)]);

    // 3. Log activity
    patch('activities', list => [{
      title: 'Member moved to Past Clients',
      body: `${client.name} removed from ${client.plan} plan (${reason})`,
      date: today
    }, ...(list || [])]);

    close();
  }

  return (
    <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && close()}>
      <div className="modal">
        <div className="modal-head">
          <div>
            <h2>Remove {client.name} from Plan</h2>
            <span>Move member from active membership to Past Clients archive</span>
          </div>
          <button className="icon-button" onClick={close}><X size={18} /></button>
        </div>

        <form className="modal-form" onSubmit={confirmRemove}>
          <div className="detail-card" style={{ marginBottom: 16 }}>
            <div className="person-avatar large">
              {client.name.split(' ').map(x => x[0]).join('')}
            </div>
            <div>
              <span>{client.id} · {client.email} · {client.phone}</span>
              <h3>Current: {client.plan} plan</h3>
              <p>Member since {client.joined} · Total paid: {money(client.paid)}</p>
            </div>
          </div>

          <div className="form-grid">
            <label className="field">
              <span>Reason for leaving plan</span>
              <select value={reason} onChange={e => setReason(e.target.value)}>
                <option value="Plan Expired">Plan Expired / Non-renewal</option>
                <option value="Relocated">Relocated to another area</option>
                <option value="Pricing / Financial">Pricing / Financial constraints</option>
                <option value="Personal Reasons">Personal / Work schedule conflict</option>
                <option value="Medical / Injury">Medical / Health / Injury pause</option>
                <option value="Joined Another Gym">Joined another gym</option>
                <option value="Dissatisfied">Dissatisfied with facilities</option>
                <option value="Other">Other</option>
              </select>
            </label>

            <label className="field">
              <span>Effective cancellation date</span>
              <input type="date" value={leftDate} onChange={e => setLeftDate(e.target.value)} required />
            </label>

            <label className="field" style={{ gridColumn: '1 / -1' }}>
              <span>Exit notes & feedback</span>
              <input
                placeholder="Optional notes or feedback from member..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="secondary" onClick={close}>Cancel</button>
            <button type="submit" className="action-pill danger" style={{ height: 36, padding: '0 14px' }}>
              <UserX size={15} /> Confirm & Move to Past Clients
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------
   LEADS CRM COMPONENT (PIPELINE, STATUS MANAGEMENT, CONVERT)
   ------------------------------------------------------------- */
export function Leads({ search = '' }) {
  const { data, patch } = useGym();
  const [stageFilter, setStageFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [term, setTerm] = useState('');
  const [addModal, setAddModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [enrollData, setEnrollData] = useState(null);

  const leads = data.leads || [];

  const stages = ['All', 'New', 'Contacted', 'Trial Scheduled', 'Follow Up', 'Converted', 'Lost'];
  const sources = ['All', 'Walk-in', 'Instagram', 'Referral', 'Google Search', 'Website', 'Facebook Ads'];

  const q = (term || search).toLowerCase();

  const filtered = useMemo(() => {
    return leads.filter(l => {
      const matchSearch = `${l.name} ${l.email} ${l.phone} ${l.goal} ${l.notes || ''}`.toLowerCase().includes(q);
      const matchStage = stageFilter === 'All' || l.status === stageFilter;
      const matchSource = sourceFilter === 'All' || l.source === sourceFilter;
      return matchSearch && matchStage && matchSource;
    });
  }, [leads, q, stageFilter, sourceFilter]);

  const stats = useMemo(() => {
    const total = leads.length;
    const trials = leads.filter(l => l.status === 'Trial Scheduled').length;
    const converted = leads.filter(l => l.status === 'Converted').length;
    const dueToday = leads.filter(l => l.followUp === today && l.status !== 'Converted' && l.status !== 'Lost').length;
    const convRate = total > 0 ? Math.round((converted / total) * 100) : 0;
    return { total, trials, converted, dueToday, convRate };
  }, [leads]);

  function updateStatus(leadId, newStatus) {
    patch('leads', list => list.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
    patch('activities', list => [{
      title: 'Lead status updated',
      body: `Lead status updated to ${newStatus}`,
      date: today
    }, ...(list || [])]);
  }

  function handleConvert(lead) {
    setEnrollData({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      plan: lead.interestedPlan || 'Standard',
      trainer: lead.assignedTo || data.trainers[0]?.name,
      fromLeadId: lead.id,
      goal: lead.goal,
      source: lead.source
    });
  }

  function saveNewLead(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const newLead = {
      id: `LD-${Date.now().toString().slice(-4)}`,
      name: f.get('name'),
      email: f.get('email'),
      phone: f.get('phone'),
      source: f.get('source'),
      goal: f.get('goal'),
      interestedPlan: f.get('plan'),
      status: 'New',
      assignedTo: f.get('assignedTo'),
      followUp: f.get('followUp'),
      notes: f.get('notes'),
      createdAt: today
    };

    patch('leads', list => [newLead, ...(list || [])]);
    patch('activities', list => [{
      title: 'New lead captured',
      body: `${newLead.name} enquired via ${newLead.source}`,
      date: today
    }, ...(list || [])]);

    setAddModal(false);
  }

  function deleteLead(id) {
    if (confirm('Delete this lead record?')) {
      patch('leads', list => list.filter(l => l.id !== id));
      if (selectedLead?.id === id) setSelectedLead(null);
    }
  }

  return (
    <>
      <Heading
        eyebrow="GYMARC CRM PIPELINE"
        title="Leads Management"
        sub="Capture, nurture, schedule trials, and convert gym inquiries into active members."
        action={
          <div className="heading-actions">
            <button className="secondary" onClick={() => exportExcel(leads, 'gymarc-leads')}>
              <Download size={15} /> Export Leads
            </button>
            <button className="primary" onClick={() => setAddModal(true)}>
              <UserPlus size={16} /> Add new lead
            </button>
          </div>
        }
      />

      {/* CRM Stats Grid */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-top">
            <span>TOTAL LEADS</span>
            <div className="stat-icon green"><Users size={17} /></div>
          </div>
          <strong>{stats.total}</strong>
          <div className="stat-trend green"><ArrowUpRight size={14} />In pipeline</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>TRIALS SCHEDULED</span>
            <div className="stat-icon amber"><CalendarDays size={17} /></div>
          </div>
          <strong>{stats.trials}</strong>
          <div className="stat-trend amber">Ready for trial workout</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>FOLLOW-UPS DUE TODAY</span>
            <div className="stat-icon red"><Clock size={17} /></div>
          </div>
          <strong>{stats.dueToday}</strong>
          <div className="stat-trend red">Requires contact</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>CONVERSION RATE</span>
            <div className="stat-icon green"><Zap size={17} /></div>
          </div>
          <strong>{stats.convRate}%</strong>
          <div className="stat-trend green">{stats.converted} converted members</div>
        </div>
      </div>

      {/* Stage Tabs */}
      <div className="crm-tabs">
        {stages.map(st => {
          const count = st === 'All' ? leads.length : leads.filter(l => l.status === st).length;
          return (
            <button
              key={st}
              className={`crm-tab ${stageFilter === st ? 'active' : ''}`}
              onClick={() => setStageFilter(st)}
            >
              <span>{st}</span>
              <span className="badge">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Leads Table Panel */}
      <div className="panel table-panel">
        <div className="table-toolbar">
          <label className="table-search">
            <Search size={16} />
            <input
              placeholder="Search leads by name, phone, email, or goal..."
              value={term}
              onChange={e => setTerm(e.target.value)}
            />
          </label>

          <div className="toolbar-actions">
            <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}>
              {sources.map(s => <option key={s} value={s}>{s === 'All' ? 'All Sources' : s}</option>)}
            </select>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>LEAD NAME</th>
                <th>FITNESS GOAL / PLAN</th>
                <th>SOURCE</th>
                <th>STATUS STAGE</th>
                <th>FOLLOW-UP DATE</th>
                <th>ASSIGNED REP</th>
                <th>QUICK CONNECT</th>
                <th>CONVERT / ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(lead => {
                const isOverdue = lead.followUp < today && lead.status !== 'Converted' && lead.status !== 'Lost';
                const isToday = lead.followUp === today && lead.status !== 'Converted' && lead.status !== 'Lost';
                return (
                  <tr key={lead.id}>
                    <td>
                      <div className="person-cell">
                        <div className="person-avatar">
                          {lead.name.split(' ').map(x => x[0]).join('')}
                        </div>
                        <div>
                          <b>{lead.name}</b>
                          <span>{lead.phone} · {lead.email}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <b>{lead.goal}</b>
                      <span className="sub-cell">Prefers: {lead.interestedPlan}</span>
                    </td>

                    <td>
                      <span className="source-tag">{lead.source}</span>
                    </td>

                    <td>
                      <select
                        className={`status-select status ${lead.status.toLowerCase().replace(' ', '')}`}
                        value={lead.status}
                        onChange={e => updateStatus(lead.id, e.target.value)}
                      >
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Trial Scheduled">Trial Scheduled</option>
                        <option value="Follow Up">Follow Up</option>
                        <option value="Converted">Converted</option>
                        <option value="Lost">Lost</option>
                      </select>
                    </td>

                    <td>
                      <div>
                        <b>{lead.followUp}</b>
                        {isToday && <span className="mini-tag" style={{ background: '#fcf3e6', color: '#b57929' }}>Due today!</span>}
                        {isOverdue && <span className="mini-tag" style={{ background: '#fae9e6', color: '#b54736' }}>Overdue</span>}
                      </div>
                    </td>

                    <td>{lead.assignedTo || 'Unassigned'}</td>

                    <td>
                      <div className="quick-connect">
                        <a
                          className="quick-btn"
                          title="Call lead"
                          href={`tel:${lead.phone.replace(/[^0-9+]/g, '')}`}
                        >
                          <Phone size={13} />
                        </a>
                        <a
                          className="quick-btn"
                          title="WhatsApp chat"
                          target="_blank"
                          rel="noreferrer"
                          href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${lead.name}, this is Northstar Fitness GymArc. Following up on your gym enquiry!`)}`}
                        >
                          <MessageSquare size={13} />
                        </a>
                        <a
                          className="quick-btn"
                          title="Send follow-up email"
                          href={`mailto:${lead.email}?subject=GymArc Membership Inquiry&body=Hi ${lead.name},%0D%0A%0D%0AThank you for your interest in Northstar Fitness GymArc. When would you like to drop by for a tour or complimentary workout trial?%0D%0A%0D%0ABest regards,%0D%0AGymArc Team`}
                        >
                          <Mail size={13} />
                        </a>
                      </div>
                    </td>

                    <td>
                      <div className="action-pills">
                        {lead.status !== 'Converted' ? (
                          <button
                            className="action-pill convert"
                            onClick={() => handleConvert(lead)}
                            title="Convert this lead into an active gym member"
                          >
                            <UserCheck size={13} /> Convert to client
                          </button>
                        ) : (
                          <span className="status converted">✓ Enrolled</span>
                        )}
                        <button className="more-btn" onClick={() => setSelectedLead(lead)}>
                          <SlidersHorizontal size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px 0', color: 'var(--muted)' }}>
                    No leads found matching current stage and filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-foot">
          Showing <b>{filtered.length}</b> of <b>{leads.length}</b> total leads
        </div>
      </div>

      {/* Add Lead Modal */}
      {addModal && (
        <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && setAddModal(false)}>
          <div className="modal">
            <div className="modal-head">
              <div>
                <h2>Capture New Lead</h2>
                <span>Record a prospective member enquiry in GymArc CRM</span>
              </div>
              <button className="icon-button" onClick={() => setAddModal(false)}><X size={18} /></button>
            </div>

            <form className="modal-form" onSubmit={saveNewLead}>
              <div className="form-grid">
                <label className="field">
                  <span>Prospect name</span>
                  <input name="name" placeholder="e.g. Aditi Rao" required />
                </label>

                <label className="field">
                  <span>Phone number</span>
                  <input name="phone" placeholder="+91 98 7654 3210" required />
                </label>

                <label className="field">
                  <span>Email address</span>
                  <input name="email" type="email" placeholder="aditi@example.com" required />
                </label>

                <label className="field">
                  <span>Lead source</span>
                  <select name="source">
                    <option value="Walk-in">Walk-in</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Referral">Member Referral</option>
                    <option value="Google Search">Google Search</option>
                    <option value="Website">Website Form</option>
                    <option value="Facebook Ads">Facebook / Meta Ads</option>
                  </select>
                </label>

                <label className="field">
                  <span>Primary fitness goal</span>
                  <input name="goal" placeholder="e.g. Weight loss, Strength training" required />
                </label>

                <label className="field">
                  <span>Interested membership plan</span>
                  <select name="plan">
                    {data.plans.map(p => (
                      <option key={p.id} value={p.name}>{p.name} ({p.duration})</option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>Assigned trainer / staff</span>
                  <select name="assignedTo">
                    {data.trainers.map(t => (
                      <option key={t.id} value={t.name}>{t.name} (Trainer)</option>
                    ))}
                    {data.staff.map(s => (
                      <option key={s.id} value={s.name}>{s.name} ({s.role})</option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>Next follow-up date</span>
                  <input name="followUp" type="date" defaultValue={today} required />
                </label>

                <label className="field" style={{ gridColumn: '1 / -1' }}>
                  <span>Notes & customer preferences</span>
                  <input name="notes" placeholder="Prefers morning batch, asked about trial session..." />
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="secondary" onClick={() => setAddModal(false)}>Cancel</button>
                <button type="submit" className="primary">Add lead to CRM <ChevronRight size={16} /></button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lead Details & Notes Modal */}
      {selectedLead && (
        <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && setSelectedLead(null)}>
          <div className="modal">
            <div className="modal-head">
              <div>
                <h2>{selectedLead.name}</h2>
                <span>Lead ID: {selectedLead.id} · Enquired: {selectedLead.createdAt}</span>
              </div>
              <button className="icon-button" onClick={() => setSelectedLead(null)}><X size={18} /></button>
            </div>

            <div className="modal-form">
              <div className="detail-card" style={{ marginBottom: 15 }}>
                <div className="person-avatar large">
                  {selectedLead.name.split(' ').map(x => x[0]).join('')}
                </div>
                <div>
                  <span>{selectedLead.phone} · {selectedLead.email}</span>
                  <h3>Goal: {selectedLead.goal}</h3>
                  <p>Source: {selectedLead.source} · Interested in: {selectedLead.interestedPlan} plan</p>
                </div>
              </div>

              <div className="workout-box" style={{ marginBottom: 15 }}>
                <span>CRM NOTES</span>
                <b>{selectedLead.notes || 'No notes logged yet.'}</b>
                <small>Assigned to: {selectedLead.assignedTo} · Next Follow-up: {selectedLead.followUp}</small>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary danger-btn"
                  onClick={() => deleteLead(selectedLead.id)}
                >
                  <Trash2 size={14} /> Delete Lead
                </button>
                {selectedLead.status !== 'Converted' && (
                  <button
                    type="button"
                    className="primary"
                    onClick={() => {
                      const l = selectedLead;
                      setSelectedLead(null);
                      handleConvert(l);
                    }}
                  >
                    <UserCheck size={15} /> Convert to client
                  </button>
                )}
                <button type="button" className="secondary" onClick={() => setSelectedLead(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Convert Lead to Client Enrollment Modal */}
      {enrollData && (
        <EnrollClientModal
          initialData={enrollData}
          close={() => setEnrollData(null)}
        />
      )}
    </>
  );
}

/* -------------------------------------------------------------
   PAST CLIENTS COMPONENT (WIN-BACK CRM, RE-ENROLLMENT, ARCHIVE)
   ------------------------------------------------------------- */
export function PastClients({ search = '', onReEnroll }) {
  const { data, patch } = useGym();
  const [reasonFilter, setReasonFilter] = useState('All');
  const [term, setTerm] = useState('');
  const [reEnrollClient, setReEnrollClient] = useState(null);

  const pastList = data.pastClients || [];
  const reasons = ['All', 'Plan Expired', 'Relocated', 'Pricing / Financial', 'Personal Reasons', 'Medical / Injury', 'Joined Another Gym'];

  const q = (term || search).toLowerCase();

  const filtered = useMemo(() => {
    return pastList.filter(p => {
      const matchSearch = `${p.name} ${p.email} ${p.phone} ${p.previousPlan || ''} ${p.leaveReason || ''}`.toLowerCase().includes(q);
      const matchReason = reasonFilter === 'All' || p.leaveReason === reasonFilter;
      return matchSearch && matchReason;
    });
  }, [pastList, q, reasonFilter]);

  const stats = useMemo(() => {
    const total = pastList.length;
    const expired = pastList.filter(p => p.leaveReason === 'Plan Expired').length;
    const avgSpend = total > 0 ? Math.round(pastList.reduce((acc, p) => acc + (p.lifetimePaid || p.paid || 0), 0) / total) : 0;
    return { total, expired, avgSpend };
  }, [pastList]);

  function handleReEnroll(past) {
    if (onReEnroll) {
      onReEnroll(past);
    } else {
      setReEnrollClient({
        fromPastClientId: past.id,
        name: past.name,
        email: past.email,
        phone: past.phone,
        plan: past.previousPlan,
        trainer: past.trainer
      });
    }
  }

  function deletePastClient(id) {
    if (confirm('Permanently remove this past client from archive?')) {
      patch('pastClients', list => list.filter(p => p.id !== id));
    }
  }

  return (
    <>
      <Heading
        eyebrow="GYMARC CHURN & RETENTION"
        title="Past Clients"
        sub="Past and churned members. Re-enroll anytime, review exit reasons, and run win-back campaigns."
        action={
          <div className="heading-actions">
            <button className="secondary" onClick={() => exportExcel(pastList, 'gymarc-past-clients')}>
              <Download size={15} /> Export Past Clients
            </button>
            <button
              className="primary"
              onClick={() => {
                setReEnrollClient({
                  name: '',
                  email: '',
                  phone: ''
                });
              }}
            >
              <RotateCcw size={15} /> Re-enroll / Add client
            </button>
          </div>
        }
      />

      {/* Retention Stats */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-top">
            <span>TOTAL PAST CLIENTS</span>
            <div className="stat-icon neutral"><UserX size={17} /></div>
          </div>
          <strong>{stats.total}</strong>
          <div className="stat-trend neutral">Archived accounts</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>PLAN EXPIRED PROSPECTS</span>
            <div className="stat-icon amber"><RotateCcw size={17} /></div>
          </div>
          <strong>{stats.expired}</strong>
          <div className="stat-trend amber">Prime for renewal offer</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>AVG LIFETIME VALUE</span>
            <div className="stat-icon green"><ShieldCheck size={17} /></div>
          </div>
          <strong>{money(stats.avgSpend)}</strong>
          <div className="stat-trend green">Past client historical spend</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>ACTIVE TO PAST RATIO</span>
            <div className="stat-icon green"><Activity size={17} /></div>
          </div>
          <strong>
            {((data.clients?.length || 1) / Math.max(1, (data.clients?.length || 1) + stats.total) * 100).toFixed(0)}%
          </strong>
          <div className="stat-trend green">Current member retention rate</div>
        </div>
      </div>

      {/* Past Clients Table */}
      <div className="panel table-panel">
        <div className="table-toolbar">
          <label className="table-search">
            <Search size={16} />
            <input
              placeholder="Search past client by name, phone, or email..."
              value={term}
              onChange={e => setTerm(e.target.value)}
            />
          </label>

          <div className="toolbar-actions">
            <select value={reasonFilter} onChange={e => setReasonFilter(e.target.value)}>
              {reasons.map(r => <option key={r} value={r}>{r === 'All' ? 'All Exit Reasons' : r}</option>)}
            </select>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>PAST MEMBER</th>
                <th>PREVIOUS MEMBERSHIP</th>
                <th>EXIT REASON</th>
                <th>MEMBERSHIP DURATION</th>
                <th>PREVIOUS TRAINER</th>
                <th>LIFETIME PAID</th>
                <th>WIN-BACK EMAIL</th>
                <th>RE-ENROLL ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(past => (
                <tr key={past.id}>
                  <td>
                    <div className="person-cell">
                      <div className="person-avatar" style={{ background: '#eee', color: '#666' }}>
                        {past.name.split(' ').map(x => x[0]).join('')}
                      </div>
                      <div>
                        <b>{past.name}</b>
                        <span>{past.id} · {past.phone} · {past.email}</span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <b>{past.previousPlan || 'Standard'}</b>
                    <span className="sub-cell">Fee: {money(past.fee)}</span>
                  </td>

                  <td>
                    <span className="reason-badge">{past.leaveReason || 'Plan Expired'}</span>
                  </td>

                  <td>
                    <div>
                      <b>Left: {past.leftDate}</b>
                      <span className="sub-cell">Joined: {past.joined}</span>
                    </div>
                  </td>

                  <td>{past.trainer || 'Unassigned'}</td>

                  <td>
                    <b>{money(past.lifetimePaid || past.paid || past.fee)}</b>
                  </td>

                  <td>
                    <a
                      className="action-pill"
                      href={`mailto:${past.email}?subject=We Miss You at Northstar Fitness GymArc!&body=Hi ${past.name},%0D%0A%0D%0AWe noticed your ${past.previousPlan || 'gym'} membership ended on ${past.leftDate}. We would love to welcome you back!%0D%0A%0D%0AEnjoy an exclusive 15% renewal discount on any membership plan this week.%0D%0A%0D%0ABest regards,%0D%0ANorthstar Fitness GymArc Team`}
                    >
                      <Mail size={12} /> Send offer
                    </a>
                  </td>

                  <td>
                    <div className="action-pills">
                      <button
                        className="action-pill reenroll"
                        onClick={() => handleReEnroll(past)}
                        title="Re-enroll this client into an active plan"
                      >
                        <RotateCcw size={13} /> Re-enroll
                      </button>
                      <button
                        className="more-btn"
                        title="Delete archive record"
                        onClick={() => deletePastClient(past.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px 0', color: 'var(--muted)' }}>
                    No past clients found in archive matching search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-foot">
          Showing <b>{filtered.length}</b> of <b>{pastList.length}</b> past clients in archive
        </div>
      </div>

      {/* Re-enroll modal */}
      {reEnrollClient && (
        <EnrollClientModal
          initialData={reEnrollClient}
          close={() => setReEnrollClient(null)}
        />
      )}
    </>
  );
}

/* -------------------------------------------------------------
   WORKOUT PLANS COMPONENT (FITNESS CRM WORKOUT TEMPLATES)
   ------------------------------------------------------------- */
export function WorkoutPlans() {
  const { data, patch } = useGym();
  const [modal, setModal] = useState(false);
  const workoutPlans = data.workoutPlans || [];

  function addPlan(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const plan = {
      id: `WP-${Date.now().toString().slice(-4)}`,
      name: f.get('name'),
      category: f.get('category'),
      duration: f.get('duration'),
      level: f.get('level'),
      daysPerWeek: Number(f.get('daysPerWeek')),
      exercises: Number(f.get('exercises')),
      assignedCount: 0,
      description: f.get('description')
    };
    patch('workoutPlans', list => [plan, ...(list || [])]);
    setModal(false);
  }

  return (
    <>
      <Heading
        eyebrow="FITNESS PROGRAMMING"
        title="Workout Plans"
        sub="Standard workout splits, training regimens, and tailored exercise schedules for gym members."
        action={
          <button className="primary" onClick={() => setModal(true)}>
            <Plus size={16} /> Create workout plan
          </button>
        }
      />

      <div className="plan-cards">
        {workoutPlans.map((w, i) => (
          <article className="panel plan-card" key={w.id}>
            <div className={`plan-card-icon p-${i % 4}`}>
              <Dumbbell size={19} />
            </div>
            <div className="plan-card-top">
              <span className="source-tag">{w.level}</span>
            </div>
            <h3>{w.name}</h3>
            <p>{w.description}</p>
            <div className="plan-price" style={{ margin: '12px 0 8px' }}>
              <strong>{w.daysPerWeek} Days/Week</strong>
              <span>· {w.duration}</span>
            </div>
            <div className="plan-feature">
              <span><Check size={14} /> Category: {w.category}</span>
              <span><Check size={14} /> {w.exercises} core exercises</span>
              <span><Check size={14} /> Assigned to {w.assignedCount} active members</span>
            </div>
            <div className="plan-card-foot">
              <button className="primary" style={{ height: 28, fontSize: 10 }}>
                Assign to member
              </button>
            </div>
          </article>
        ))}
      </div>

      {modal && (
        <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-head">
              <h2>Create Workout Plan</h2>
              <button className="icon-button" onClick={() => setModal(false)}><X size={18} /></button>
            </div>
            <form className="modal-form" onSubmit={addPlan}>
              <div className="form-grid">
                <label className="field">
                  <span>Plan title</span>
                  <input name="name" required placeholder="e.g. 5-Day Push Pull Legs" />
                </label>
                <label className="field">
                  <span>Category</span>
                  <select name="category">
                    <option>Muscle Building</option>
                    <option>Weight Loss</option>
                    <option>General Fitness</option>
                    <option>Mobility & Rehab</option>
                    <option>Strength & Conditioning</option>
                  </select>
                </label>
                <label className="field">
                  <span>Duration</span>
                  <input name="duration" defaultValue="8 Weeks" required />
                </label>
                <label className="field">
                  <span>Experience level</span>
                  <select name="level">
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                    <option>All Levels</option>
                  </select>
                </label>
                <label className="field">
                  <span>Days per week</span>
                  <input name="daysPerWeek" type="number" min="1" max="7" defaultValue="4" required />
                </label>
                <label className="field">
                  <span>Number of exercises</span>
                  <input name="exercises" type="number" min="1" defaultValue="14" required />
                </label>
                <label className="field" style={{ gridColumn: '1 / -1' }}>
                  <span>Description & target outcome</span>
                  <input name="description" placeholder="Short description of this routine..." required />
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="secondary" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="primary">Save workout plan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

/* -------------------------------------------------------------
   DIET PLANS COMPONENT (NUTRITION CRM MACRO PLANS)
   ------------------------------------------------------------- */
export function DietPlans() {
  const { data, patch } = useGym();
  const [modal, setModal] = useState(false);
  const dietPlans = data.dietPlans || [];

  function addDiet(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const plan = {
      id: `DP-${Date.now().toString().slice(-4)}`,
      name: f.get('name'),
      type: f.get('type'),
      calories: f.get('calories'),
      protein: f.get('protein'),
      carbs: f.get('carbs'),
      fats: f.get('fats'),
      assignedCount: 0,
      summary: f.get('summary')
    };
    patch('dietPlans', list => [plan, ...(list || [])]);
    setModal(false);
  }

  return (
    <>
      <Heading
        eyebrow="NUTRITION & MACROS"
        title="Diet Plans"
        sub="Tailored calorie and macronutrient guides to fuel members' workouts and lifestyle goals."
        action={
          <button className="primary" onClick={() => setModal(true)}>
            <Plus size={16} /> Create diet plan
          </button>
        }
      />

      <div className="plan-cards">
        {dietPlans.map((d, i) => (
          <article className="panel plan-card" key={d.id}>
            <div className={`plan-card-icon p-${(i + 1) % 4}`}>
              <Activity size={19} />
            </div>
            <div className="plan-card-top">
              <span className="source-tag">{d.type}</span>
            </div>
            <h3>{d.name}</h3>
            <p>{d.summary}</p>
            <div className="plan-price" style={{ margin: '12px 0 8px' }}>
              <strong>{d.calories}</strong>
              <span>daily target</span>
            </div>
            <div className="plan-feature">
              <span><Check size={14} /> Protein: {d.protein}</span>
              <span><Check size={14} /> Carbs: {d.carbs} · Fats: {d.fats}</span>
              <span><Check size={14} /> Active members on plan: {d.assignedCount}</span>
            </div>
            <div className="plan-card-foot">
              <button className="primary" style={{ height: 28, fontSize: 10 }}>
                Assign to member
              </button>
            </div>
          </article>
        ))}
      </div>

      {modal && (
        <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-head">
              <h2>Create Diet Plan</h2>
              <button className="icon-button" onClick={() => setModal(false)}><X size={18} /></button>
            </div>
            <form className="modal-form" onSubmit={addDiet}>
              <div className="form-grid">
                <label className="field">
                  <span>Diet plan name</span>
                  <input name="name" required placeholder="e.g. Lean Bulk Fuel" />
                </label>
                <label className="field">
                  <span>Diet type</span>
                  <select name="type">
                    <option>Muscle Gain</option>
                    <option>Weight Loss</option>
                    <option>Balanced Nutrition</option>
                    <option>Low Carb / Keto</option>
                    <option>Vegetarian</option>
                  </select>
                </label>
                <label className="field">
                  <span>Daily calories</span>
                  <input name="calories" defaultValue="2,400 kcal" required />
                </label>
                <label className="field">
                  <span>Target protein</span>
                  <input name="protein" defaultValue="150g" required />
                </label>
                <label className="field">
                  <span>Carbohydrates</span>
                  <input name="carbs" defaultValue="220g" required />
                </label>
                <label className="field">
                  <span>Healthy fats</span>
                  <input name="fats" defaultValue="60g" required />
                </label>
                <label className="field" style={{ gridColumn: '1 / -1' }}>
                  <span>Meal guidelines & food sources</span>
                  <input name="summary" placeholder="Summary of food recommendations..." required />
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="secondary" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="primary">Save diet plan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

/* -------------------------------------------------------------
   ACTIVITY HISTORY COMPONENT (CRM AUDIT LOG)
   ------------------------------------------------------------- */
export function ActivityHistory() {
  const { data } = useGym();
  const activities = data.activities || [];

  return (
    <>
      <Heading
        eyebrow="AUDIT TRAIL"
        title="Activity History"
        sub="A transparent chronological record of all member enrollments, lead conversions, and CRM actions."
      />

      <div className="panel activity-panel">
        <div className="panel-head">
          <div>
            <h3>All recorded gym activities</h3>
            <span>Recent operations and CRM events</span>
          </div>
        </div>
        <div className="activity-list">
          {activities.length > 0 ? (
            activities.map((act, i) => (
              <div className="activity-item" key={i}>
                <div className="activity-icon check">
                  <Check size={16} />
                </div>
                <div className="activity-copy">
                  <b>{act.title}</b>
                  <span>{act.body}</span>
                </div>
                <time>{act.date || today}</time>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--muted)' }}>
              No activities logged yet.
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* -------------------------------------------------------------
   EXISTING CORE EXTRA PAGES WITH GYMARC BRANDING
   ------------------------------------------------------------- */
export function ClientPage({ page }) {
  const { data } = useGym();
  const c = data.clients.find(x => x.name === 'Aarav Patel') || data.clients[0];
  const payments = data.payments.filter(p => p.clientId === c.id);

  return (
    <>
      <Heading
        eyebrow="YOUR GYMARC MEMBERSHIP"
        title={page === 'Dashboard' ? `Good morning, ${c.name.split(' ')[0]}` : page}
        sub="You’re showing up for yourself. Keep that momentum going."
      />
      <div className="client-hero">
        <div>
          <span className="eyebrow light"><span /> MEMBERSHIP IN GOOD SHAPE</span>
          <h2>{c.plan} <em>membership</em></h2>
          <p>Your next chapter starts with your next session.</p>
        </div>
        <div className="hero-badge">
          <Dumbbell size={24} />
          <span>MEMBER SINCE</span>
          <b>{c.joined}</b>
        </div>
      </div>
      <div className="due-banner">
        <div className="due-banner-icon"><CalendarDays size={20} /></div>
        <div>
          <span>NEXT PAYMENT DUE</span>
          <b>{money(Math.max(0, c.fee - c.paid))}</b>
          <small>Due {c.due} · {c.plan} plan</small>
        </div>
        <span className="status partial">Upcoming</span>
      </div>
      <div className="stat-grid client-stats">
        {[
          ['Total membership fee', money(c.fee)],
          ['Amount paid', money(c.paid)],
          ['Outstanding balance', money(Math.max(0, c.fee - c.paid))],
          ['Membership expiry', c.expiry]
        ].map(([a, b]) => (
          <div className="stat-card" key={a}>
            <div className="stat-top">
              <span>{a}</span>
              <div className="stat-icon green"><ShieldCheck size={16} /></div>
            </div>
            <strong>{b}</strong>
          </div>
        ))}
      </div>
      <div className="lower-grid">
        <div className="panel activity-panel">
          <div className="panel-head">
            <div>
              <h3>Payment history</h3>
              <span>Your recent membership payments</span>
            </div>
          </div>
          {payments.map(p => (
            <div className="activity-item" key={p.id}>
              <div className="activity-icon check"><Check size={16} /></div>
              <div className="activity-copy">
                <b>{c.plan} membership payment</b>
                <span>{p.date} · {p.method}</span>
              </div>
              <b>{money(p.amount)}</b>
            </div>
          ))}
        </div>
        <div className="panel trainer-panel">
          <div className="panel-head">
            <div>
              <h3>Your trainer</h3>
              <span>Here to help you progress</span>
            </div>
          </div>
          <h3>{c.trainer}</h3>
          <div className="workout-box">
            <span>THIS WEEK’S FOCUS</span>
            <b>Strength & mobility</b>
            <small>3 sessions · 45 min each</small>
          </div>
        </div>
      </div>
    </>
  );
}

function Receipt({ c, p }) {
  import('jspdf').then(({ jsPDF }) => {
    const d = new jsPDF();
    d.setFontSize(22);
    d.text('GYMARC', 18, 22);
    d.setFontSize(11);
    d.text('PAYMENT RECEIPT', 18, 34);
    d.text(`Receipt: ${p.id}`, 18, 48);
    d.text(`Member: ${c.name} (${c.id})`, 18, 59);
    d.text(`Membership: ${c.plan}`, 18, 70);
    d.text(`Payment date: ${p.date}`, 18, 81);
    d.text(`Method: ${p.method}`, 18, 92);
    d.setFontSize(15);
    d.text(`Amount received: ${money(p.amount)}`, 18, 108);
    d.save(`${p.id}-gymarc-receipt.pdf`);
  });
}

export function Invoices() {
  const { data } = useGym();
  const [emails, setEmails] = useState({});

  return (
    <>
      <Heading
        eyebrow="DOCUMENTS"
        title="Invoices & receipts"
        sub="Download confirmed receipts or prepare an invoice email for a member."
      />
      <div className="panel table-panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>RECEIPT</th>
                <th>MEMBER</th>
                <th>DATE</th>
                <th>METHOD</th>
                <th>AMOUNT</th>
                <th>FORWARD TO</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.payments.map(p => {
                const c = data.clients.find(x => x.id === p.clientId);
                const recipient = emails[p.id] ?? c?.email ?? '';
                return (
                  <tr key={p.id}>
                    <td className="id-cell">{p.id}</td>
                    <td>{c?.name}</td>
                    <td>{p.date}</td>
                    <td>{p.method}</td>
                    <td><b>{money(p.amount)}</b></td>
                    <td>
                      <div className="mail-actions">
                        <input
                          type="email"
                          aria-label={`Invoice email for ${c?.name}`}
                          placeholder="client@email.com"
                          value={recipient}
                          onChange={e => setEmails(x => ({ ...x, [p.id]: e.target.value }))}
                        />
                        <button
                          className="mail-send"
                          type="button"
                          disabled={!recipient.trim()}
                          onClick={() => {
                            const subject = `Payment receipt ${p.id} · Northstar Fitness GymArc`;
                            const body = `Hello ${c?.name},\n\nHere are the details for your confirmed membership payment.\n\nReceipt: ${p.id}\nMember ID: ${c?.id}\nMembership: ${c?.plan}\nPayment date: ${p.date}\nMethod: ${p.method}\nAmount received: ${money(p.amount)}\n\nThank you,\nNorthstar Fitness GymArc`;
                            window.location.href = `mailto:${encodeURIComponent(recipient.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                          }}
                        >
                          Forward
                        </button>
                      </div>
                    </td>
                    <td>
                      <button className="secondary" onClick={() => Receipt({ c, p })}>
                        <Download size={14} /> PDF
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="footer-note">Forward opens a prefilled email draft; PDF downloads are available to attach if needed.</div>
    </>
  );
}

export function Announcements() {
  const { data, patch } = useGym();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Heading
        eyebrow="COMMUNITY"
        title="Announcements"
        sub="Keep your members in the loop."
        action={
          <button className="primary" onClick={() => setOpen(true)}>
            <Plus size={16} /> New announcement
          </button>
        }
      />
      <div className="announcement-list">
        {data.announcements.map(a => (
          <div className="panel announcement" key={a.id}>
            <div className="activity-icon calendar"><Sparkles size={17} /></div>
            <div>
              <span>{a.date} · {a.audience}</span>
              <h3>{a.title}</h3>
              <p>{a.body}</p>
            </div>
            <button className="more-btn" onClick={() => patch('announcements', x => x.filter(y => y.id !== a.id))}>
              <X size={17} />
            </button>
          </div>
        ))}
      </div>
      {open && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-head">
              <h2>New announcement</h2>
              <button className="icon-button" onClick={() => setOpen(false)}><X /></button>
            </div>
            <form
              className="modal-form"
              onSubmit={e => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                patch('announcements', a => [
                  {
                    id: Date.now(),
                    title: f.get('title'),
                    body: f.get('body'),
                    audience: f.get('audience'),
                    date: today,
                    active: true
                  },
                  ...a
                ]);
                setOpen(false);
              }}
            >
              <div className="form-grid">
                <label className="field"><span>Title</span><input name="title" required /></label>
                <label className="field">
                  <span>Audience</span>
                  <select name="audience">
                    <option>All members</option>
                    <option>Active members</option>
                  </select>
                </label>
                <label className="field"><span>Message</span><input name="body" required /></label>
              </div>
              <div className="modal-actions">
                <button type="button" className="secondary" onClick={() => setOpen(false)}>Cancel</button>
                <button className="primary">Publish announcement</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function Notifications() {
  const { data } = useGym();
  return (
    <>
      <Heading
        eyebrow="STAY IN THE KNOW"
        title="Notifications"
        sub="The latest updates from your GymArc workspace."
      />
      <div className="panel activity-panel">
        {[
          ['Payment reminder', '3 memberships are due this week.'],
          ['Payment received', 'A new member payment was recorded.'],
          ...data.announcements.map(a => ['Gym announcement', a.title])
        ].map(([a, b], idx) => (
          <div className="activity-item" key={idx}>
            <div className="activity-icon calendar"><Bell size={16} /></div>
            <div className="activity-copy">
              <b>{a}</b>
              <span>{b}</span>
            </div>
            <time>Today</time>
          </div>
        ))}
      </div>
    </>
  );
}

export function SettingsPage() {
  return (
    <>
      <Heading
        eyebrow="WORKSPACE PREFERENCES"
        title="Settings"
        sub="Manage your GymArc demo workspace and preferences."
      />
      <div className="panel settings-card">
        <div className="setting-row">
          <div>
            <h3>Reset demo data</h3>
            <p>Restore the original GymArc members, plans, payments, leads, and expenses.</p>
          </div>
          <button
            className="secondary danger-btn"
            onClick={() => {
              if (confirm('Reset all GymArc demo data to its original state?')) {
                localStorage.removeItem('gymarc-data');
                localStorage.removeItem('forma-data');
                location.reload();
              }
            }}
          >
            Reset data
          </button>
        </div>
        <div className="setting-row">
          <div>
            <h3>Demo authentication</h3>
            <p>This demo stores session and GymArc CRM data in this browser only.</p>
          </div>
          <span className="status paid">Frontend only</span>
        </div>
      </div>
    </>
  );
}

export function GenericPage({ page }) {
  return (
    <>
      <Heading
        eyebrow="GYMARC WORKSPACE"
        title={page}
        sub="Your gym operations and member records, in one thoughtful place."
      />
      <div className="panel empty-state">
        <div className="empty-icon"><Activity size={25} /></div>
        <h3>{page}</h3>
        <p>Your gym operations and member CRM records are organized in one place.</p>
      </div>
    </>
  );
}

export function exportExcel(rows, name) {
  import('xlsx').then(XLSX => {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `${name}.xlsx`);
  });
}
