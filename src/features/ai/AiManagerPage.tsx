/* Platform-admin screen for ai.
 * Reads live CGS admin APIs so operators can manage clinics and usage. */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  ShieldCheck,
  Activity,
  DollarSign,
  MessageSquare,
  Building2,
  Play,
  Layers,
  CheckCircle2,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { aiApi } from '../../api/ai.api';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatCompactNumber } from '../../utils/formatters';

export const AiManagerPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'health' | 'usage' | 'conversations' | 'entities' | 'playground'>('health');
  const [timeRange, setTimeRange] = useState<number>(30);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);

  // Playground state
  const [testEntityType, setTestEntityType] = useState('CLINIC');
  const [testEntityId, setTestEntityId] = useState('apex-dental');
  const [testMessage, setTestMessage] = useState('Kal subah slot available hai kya?');
  const [testResponse, setTestResponse] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Entity Modal state
  const [isEntityModalOpen, setIsEntityModalOpen] = useState(false);
  const [newEntity, setNewEntity] = useState({
    type: 'CHATBOT',
    name: '',
    system_prompt: '',
    configuration: '{}',
  });

  // Queries
  const { data: health } = useQuery({
    queryKey: ['admin', 'ai', 'health'],
    queryFn: () => aiApi.getHealth(),
  });

  const { data: usageSummary } = useQuery({
    queryKey: ['admin', 'ai', 'usage', 'summary', timeRange],
    queryFn: () => aiApi.getUsageSummary(timeRange),
  });

  const { data: modelUsage = [] } = useQuery({
    queryKey: ['admin', 'ai', 'usage', 'models', timeRange],
    queryFn: () => aiApi.getModelBreakdown(timeRange),
  });

  const { data: entityUsage = [] } = useQuery({
    queryKey: ['admin', 'ai', 'usage', 'entities', timeRange],
    queryFn: () => aiApi.getEntityBreakdown(timeRange),
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ['admin', 'ai', 'conversations'],
    queryFn: () => aiApi.getConversations(50),
  });

  const { data: selectedConv } = useQuery({
    queryKey: ['admin', 'ai', 'conversation', selectedConvId],
    queryFn: () => (selectedConvId ? aiApi.getConversationById(selectedConvId) : null),
    enabled: !!selectedConvId,
  });

  const { data: entities = [] } = useQuery({
    queryKey: ['admin', 'ai', 'entities'],
    queryFn: () => aiApi.getEntities(),
  });

  // Run Test Mutation
  const handleRunTest = async () => {
    setIsGenerating(true);
    setTestResponse(null);
    try {
      const res = await aiApi.runTestGenerate({
        entity_id: testEntityId,
        entity_type: testEntityType,
        participant_id: '+919876543210',
        message: testMessage,
      });
      setTestResponse(res);
    } catch (err: any) {
      setTestResponse({ error: err.message || 'Generation failed' });
    } finally {
      setIsGenerating(false);
    }
  };

  // Create Entity Mutation
  const createEntityMutation = useMutation({
    mutationFn: (data: any) => aiApi.createEntity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'ai', 'entities'] });
      setIsEntityModalOpen(false);
      setNewEntity({ type: 'CHATBOT', name: '', system_prompt: '', configuration: '{}' });
    },
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            AI Control Center & Intelligence Hub
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Decoupled multi-entity intelligence engine, OpenRouter token ledger, conversation inspector, and real-time health.
          </p>
        </div>
        <Badge variant={health?.aiService === 'ONLINE' ? 'success' : 'warning'}>
          ● AI Service: {health?.aiService || 'INITIALIZING'}
        </Badge>
      </div>

      {/* Security Banner */}
      <div
        style={{
          padding: '14px 18px',
          backgroundColor: 'var(--status-ai-bg, #f3e8ff)',
          border: '1px solid var(--status-ai-border, #d8b4fe)',
          borderRadius: 'var(--radius-md, 8px)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '13px',
          color: '#6b21a8',
        }}
      >
        <ShieldCheck size={20} color="#9333ea" />
        <div>
          <strong>Strict Architectural Decoupling:</strong> The Python AI backend has zero direct database credentials for CGS. Doctor and clinic requests execute through authenticated internal APIs (<code>/api/v1/internal/ai/*</code>), while generic entities query their own dedicated database.
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color, #e2e8f0)', paddingBottom: '10px' }}>
        <button
          onClick={() => setActiveTab('health')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '13.5px',
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: activeTab === 'health' ? 'var(--c-primary-700, #0f766e)' : 'transparent',
            color: activeTab === 'health' ? '#ffffff' : 'var(--text-muted, #64748b)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Activity size={16} /> Health & Infrastructure
        </button>

        <button
          onClick={() => setActiveTab('usage')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '13.5px',
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: activeTab === 'usage' ? 'var(--c-primary-700, #0f766e)' : 'transparent',
            color: activeTab === 'usage' ? '#ffffff' : 'var(--text-muted, #64748b)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <DollarSign size={16} /> Usage & API Cost Ledger
        </button>

        <button
          onClick={() => setActiveTab('conversations')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '13.5px',
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: activeTab === 'conversations' ? 'var(--c-primary-700, #0f766e)' : 'transparent',
            color: activeTab === 'conversations' ? '#ffffff' : 'var(--text-muted, #64748b)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <MessageSquare size={16} /> Conversations Inspector
        </button>

        <button
          onClick={() => setActiveTab('entities')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '13.5px',
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: activeTab === 'entities' ? 'var(--c-primary-700, #0f766e)' : 'transparent',
            color: activeTab === 'entities' ? '#ffffff' : 'var(--text-muted, #64748b)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Building2 size={16} /> Generic Entities
        </button>

        <button
          onClick={() => setActiveTab('playground')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '13.5px',
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: activeTab === 'playground' ? 'var(--c-primary-700, #0f766e)' : 'transparent',
            color: activeTab === 'playground' ? '#ffffff' : 'var(--text-muted, #64748b)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Play size={16} /> Test Console
        </button>
      </div>

      {/* TAB 1: HEALTH & INFRASTRUCTURE */}
      {activeTab === 'health' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="grid-cards-4">
            <Card title="Python AI Service">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <CheckCircle2 color="var(--c-emerald-600, #059669)" size={20} />
                <span style={{ fontSize: '15px', fontWeight: 700 }}>FastAPI Running (Port 8000)</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                4-layer memory & tool execution active
              </p>
            </Card>

            <Card title="OpenRouter AI Provider">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <Sparkles color="#9333ea" size={20} />
                <span style={{ fontSize: '15px', fontWeight: 700 }}>Google: Gemma 4 31B</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                google/gemma-4-31b-it
              </p>
            </Card>

            <Card title="CGS Internal Bridge">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <CheckCircle2 color="var(--c-emerald-600, #059669)" size={20} />
                <span style={{ fontSize: '15px', fontWeight: 700 }}>Authenticated API</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Header: X-Internal-Service-Key
              </p>
            </Card>

            <Card title="Dedicated AI Database">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <Layers color="#2563eb" size={20} />
                <span style={{ fontSize: '15px', fontWeight: 700 }}>Async SQLite / PG</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Dedicated conversation & usage datastore
              </p>
            </Card>
          </div>

          <Card title="LLM Models & Capabilities Matrix">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color, #e2e8f0)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px' }}>Model Name</th>
                  <th style={{ padding: '10px' }}>Role</th>
                  <th style={{ padding: '10px' }}>Input Rate / 1M</th>
                  <th style={{ padding: '10px' }}>Output Rate / 1M</th>
                  <th style={{ padding: '10px' }}>Tool Calling Support</th>
                  <th style={{ padding: '10px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-color, #f1f5f9)' }}>
                  <td style={{ padding: '12px 10px', fontWeight: 600 }}>Google: Gemma 4 31B</td>
                  <td style={{ padding: '12px 10px' }}><Badge variant="info">DEFAULT</Badge></td>
                  <td style={{ padding: '12px 10px' }}>$0.08</td>
                  <td style={{ padding: '12px 10px' }}>$0.35</td>
                  <td style={{ padding: '12px 10px', color: 'var(--c-emerald-600)' }}>Supported (Autonomous)</td>
                  <td style={{ padding: '12px 10px' }}><Badge variant="success">OPERATIONAL</Badge></td>
                </tr>
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* TAB 2: USAGE & COST LEDGER */}
      {activeTab === 'usage' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Time Filter */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setTimeRange(d)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  backgroundColor: timeRange === d ? 'var(--c-primary-700, #0f766e)' : '#ffffff',
                  color: timeRange === d ? '#ffffff' : 'var(--text-primary, #1e293b)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Last {d} Days
              </button>
            ))}
          </div>

          {/* Metric Cards */}
          <div className="grid-cards-4">
            <Card title="Total AI Requests">
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {formatCompactNumber(usageSummary?.total_requests || 0)}
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Avg Cost: ₹{(usageSummary?.avg_cost_per_request || 0).toFixed(4)}</span>
            </Card>

            <Card title="Total Tokens Consumed">
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {formatCompactNumber(usageSummary?.total_tokens || 0)}
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Prompt: {formatCompactNumber(usageSummary?.prompt_tokens || 0)} | Comp: {formatCompactNumber(usageSummary?.completion_tokens || 0)}
              </span>
            </Card>

            <Card title="Estimated Inference Cost">
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--c-primary-700, #0f766e)' }}>
                ${(usageSummary?.estimated_cost || 0).toFixed(4)}
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>USD (~₹{((usageSummary?.estimated_cost || 0) * 85).toFixed(2)})</span>
            </Card>

            <Card title="Today's Spend">
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                ${(usageSummary?.today_cost || 0).toFixed(4)}
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Month: ${(usageSummary?.month_cost || 0).toFixed(4)}</span>
            </Card>
          </div>

          {/* Model Breakdown & Entity Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
            <Card title="LLM Model Usage Breakdown">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '8px' }}>Model</th>
                    <th style={{ padding: '8px' }}>Requests</th>
                    <th style={{ padding: '8px' }}>Tokens</th>
                    <th style={{ padding: '8px' }}>Cost</th>
                    <th style={{ padding: '8px' }}>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {modelUsage.map((m, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 8px', fontWeight: 600 }}>{m.model.split('/')[1] || m.model}</td>
                      <td style={{ padding: '10px 8px' }}>{m.requests}</td>
                      <td style={{ padding: '10px 8px' }}>{formatCompactNumber(m.total_tokens)}</td>
                      <td style={{ padding: '10px 8px' }}>${m.cost.toFixed(4)}</td>
                      <td style={{ padding: '10px 8px' }}><Badge variant="info">{m.percentage}%</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            <Card title="Entity Consumption Breakdown">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '8px' }}>Entity</th>
                    <th style={{ padding: '8px' }}>Type</th>
                    <th style={{ padding: '8px' }}>Requests</th>
                    <th style={{ padding: '8px' }}>Tokens</th>
                    <th style={{ padding: '8px' }}>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {entityUsage.map((e, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 8px', fontWeight: 600 }}>{e.name}</td>
                      <td style={{ padding: '10px 8px' }}><Badge variant="neutral">{e.type}</Badge></td>
                      <td style={{ padding: '10px 8px' }}>{e.requests}</td>
                      <td style={{ padding: '10px 8px' }}>{formatCompactNumber(e.total_tokens)}</td>
                      <td style={{ padding: '10px 8px' }}>${e.cost.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 3: CONVERSATIONS INSPECTOR */}
      {activeTab === 'conversations' && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedConvId ? '1fr 1.2fr' : '1fr', gap: '20px' }}>
          <Card title="Conversations in AI Memory Ledger">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: selectedConvId === conv.id ? '2px solid var(--c-primary-700, #0f766e)' : '1px solid #e2e8f0',
                    backgroundColor: selectedConvId === conv.id ? '#f0fdfa' : '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '13.5px' }}>{conv.participant_id}</span>
                      <Badge variant="info">{conv.entity_type}</Badge>
                      <Badge variant="neutral">{conv.channel}</Badge>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Entity: {conv.entity_name} | {conv.message_count} messages
                    </div>
                  </div>
                  <Button size="sm" variant="outline">Inspect</Button>
                </div>
              ))}
            </div>
          </Card>

          {/* Conversation Detail View */}
          {selectedConvId && (
            <Card
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <span>Transcript: {selectedConv?.participant_id}</span>
                  <button
                    onClick={() => setSelectedConvId(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}
                  >
                    ✕
                  </button>
                </div>
              }
            >
              {selectedConv?.summary && (
                <div style={{ padding: '10px 12px', backgroundColor: '#fef3c7', borderRadius: '6px', fontSize: '12.5px', marginBottom: '14px' }}>
                  <strong>Consolidated Memory Summary:</strong> {selectedConv.summary}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '500px', overflowY: 'auto' }}>
                {selectedConv?.messages.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: m.sender_type === 'USER' ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      backgroundColor: m.sender_type === 'USER' ? 'var(--c-primary-700, #0f766e)' : '#f1f5f9',
                      color: m.sender_type === 'USER' ? '#ffffff' : '#1e293b',
                      fontSize: '13px',
                    }}
                  >
                    <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '2px', fontWeight: 600 }}>
                      {m.sender_type} {m.tokens ? `(${m.tokens} tokens)` : ''}
                    </div>
                    <div>{m.content}</div>

                    {/* Show executed tool calls if present */}
                    {m.metadata?.tool_calls && m.metadata.tool_calls.length > 0 && (
                      <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed #cbd5e1', fontSize: '11.5px' }}>
                        <span style={{ fontWeight: 600, color: '#d97706' }}>⚡ Executed Tool Call:</span>
                        {m.metadata.tool_calls.map((tc: any, i: number) => (
                          <div key={i} style={{ fontFamily: 'monospace', marginTop: '2px' }}>
                            {tc.tool_name}({JSON.stringify(tc.arguments)})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* TAB 4: GENERIC ENTITIES MANAGEMENT */}
      {activeTab === 'entities' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Universal Entity Registry</h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                Registered entities in the dedicated AI database. Any entity (Restaurant, Ecommerce, Chatbot) uses this store.
              </p>
            </div>
            <Button onClick={() => setIsEntityModalOpen(true)} size="sm">
              <Plus size={16} /> Register New Entity
            </Button>
          </div>

          <div className="grid-cards-2">
            {entities.map((ent) => (
              <Card
                key={ent.id}
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <span>{ent.name}</span>
                    <Badge variant="info">{ent.type}</Badge>
                  </div>
                }
                subtitle={`Entity ID: ${ent.id}`}
              >
                <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>System Prompt:</span>
                    <p style={{ marginTop: '2px', fontStyle: 'italic', color: 'var(--text-primary)' }}>
                      "{ent.system_prompt || 'Standard helpful assistant prompt.'}"
                    </p>
                  </div>

                  {ent.configuration && (
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Configuration:</span>
                      <pre style={{ fontSize: '11.5px', backgroundColor: '#f8fafc', padding: '6px 8px', borderRadius: '4px', marginTop: '2px' }}>
                        {JSON.stringify(ent.configuration, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Modal for creating new generic entity */}
          {isEntityModalOpen && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
              }}
            >
              <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '8px', width: '500px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Register New Generic AI Entity</h3>

                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 600 }}>Entity Type</label>
                  <select
                    value={newEntity.type}
                    onChange={(e) => setNewEntity({ ...newEntity, type: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                  >
                    <option value="CHATBOT">CHATBOT</option>
                    <option value="RESTAURANT">RESTAURANT</option>
                    <option value="ECOMMERCE">ECOMMERCE</option>
                    <option value="SCHOOL">SCHOOL</option>
                    <option value="CORPORATE">CORPORATE</option>
                    <option value="CUSTOM">CUSTOM</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 600 }}>Entity Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Bake & Brew Bistro"
                    value={newEntity.name}
                    onChange={(e) => setNewEntity({ ...newEntity, name: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 600 }}>System Prompt Instructions</label>
                  <textarea
                    rows={3}
                    placeholder="You are a helpful assistant for..."
                    value={newEntity.system_prompt}
                    onChange={(e) => setNewEntity({ ...newEntity, system_prompt: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                  <Button variant="outline" onClick={() => setIsEntityModalOpen(false)}>Cancel</Button>
                  <Button
                    onClick={() => createEntityMutation.mutate(newEntity)}
                    disabled={!newEntity.name}
                  >
                    Create Entity
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: TEST PLAYGROUND */}
      {activeTab === 'playground' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <Card title="Simulate Inbound Message">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12.5px', fontWeight: 600 }}>Entity Type</label>
                <select
                  value={testEntityType}
                  onChange={(e) => {
                    setTestEntityType(e.target.value);
                    if (e.target.value === 'CLINIC') setTestEntityId('apex-dental');
                    else if (e.target.value === 'DOCTOR') setTestEntityId('doc-001');
                    else setTestEntityId('ent_rest_01');
                  }}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                >
                  <option value="CLINIC">CLINIC (Resolves CGS Doctors & Services)</option>
                  <option value="DOCTOR">DOCTOR (Resolves Doctor Specific Context)</option>
                  <option value="RESTAURANT">RESTAURANT (Dedicated AI DB)</option>
                  <option value="ECOMMERCE">ECOMMERCE (Dedicated AI DB)</option>
                  <option value="CHATBOT">CHATBOT (Dedicated AI DB)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12.5px', fontWeight: 600 }}>Entity ID / Identifier</label>
                <input
                  type="text"
                  value={testEntityId}
                  onChange={(e) => setTestEntityId(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12.5px', fontWeight: 600 }}>Inbound Message Text</label>
                <textarea
                  rows={4}
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                />
              </div>

              <Button onClick={handleRunTest} disabled={isGenerating}>
                {isGenerating ? <RefreshCw className="animate-spin" size={16} /> : <Play size={16} />}
                {isGenerating ? 'Generating & Executing Tools...' : 'Send AI Request'}
              </Button>
            </div>
          </Card>

          <Card title="Live Execution & Tool Response Output">
            {testResponse ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                <div style={{ padding: '12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px' }}>
                  <div style={{ fontWeight: 700, color: '#166534', marginBottom: '4px' }}>AI Response:</div>
                  <p style={{ margin: 0, color: '#14532d' }}>{testResponse.response || testResponse.error}</p>
                </div>

                {testResponse.tool_calls && testResponse.tool_calls.length > 0 && (
                  <div style={{ padding: '12px', backgroundColor: '#fef3c7', border: '1px solid #fde68a', borderRadius: '6px' }}>
                    <div style={{ fontWeight: 700, color: '#92400e', marginBottom: '4px' }}>⚡ Executed Tool Calls:</div>
                    {testResponse.tool_calls.map((tc: any, i: number) => (
                      <div key={i} style={{ marginTop: '4px', fontFamily: 'monospace', fontSize: '12px' }}>
                        <div><strong>Tool:</strong> {tc.tool_name}</div>
                        <div><strong>Arguments:</strong> {JSON.stringify(tc.arguments)}</div>
                        <div><strong>Result:</strong> {JSON.stringify(tc.result)}</div>
                      </div>
                    ))}
                  </div>
                )}

                {testResponse.usage && (
                  <div style={{ padding: '10px', backgroundColor: '#f8fafc', borderRadius: '6px', fontSize: '12px' }}>
                    <strong>Token Accounting:</strong> {testResponse.usage.total_tokens} total tokens ({testResponse.usage.prompt_tokens} prompt, {testResponse.usage.completion_tokens} completion) | Model: {testResponse.model} | Latency: {testResponse.duration_ms}ms
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--text-muted)' }}>
                Click "Send AI Request" to execute an end-to-end multi-step tool call.
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};
