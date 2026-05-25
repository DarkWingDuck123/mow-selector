import { useState, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Header } from '../../components/page';
import factions from '../../assets/factions.json';
import factionMeta from '../../utils/card/db/all_faction_meta.json';
import { saveCustomFaction, deleteCustomFaction } from '../../state/customFactions';
import '../cardbuilder/CardBuilder.css';
import './FactionBuilder.css';

const LANG_CODES = ['de', 'es', 'fr'];
const LANG_LABELS = { de: 'Deutsch', es: 'Español', fr: 'Français' };

// --- Schema parsing ---

function parseSchema(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return [];
  const fields = [];
  for (const key of Object.keys(obj)) {
    if (!key.endsWith('_meta')) continue;
    const dataKey = key.slice(0, -5);
    if (!dataKey) continue;
    const meta = obj[key];
    const example = obj[dataKey];
    const field = {
      key: dataKey,
      name_en: meta.name_en,
      type: meta.type,
      subtype: meta.subtype,
      optional: meta.optional || false,
    };
    if (meta.type === 'ARRAY' && Array.isArray(example) && example.length > 0) {
      if (!['STRING'].includes(meta.subtype)) {
        field.itemSchema = parseSchema(example[0]);
      }
    }
    if (meta.type === 'OBJECT' && example && typeof example === 'object' && !Array.isArray(example)) {
      field.objectSchema = parseSchema(example);
    }
    fields.push(field);
  }
  return fields;
}

// --- Initial value helpers ---

function makeInitialValue(field) {
  switch (field.type) {
    case 'ENUM':
    case 'STRING': return '';
    case 'INTERNATIONALIZED_STRING': return { value: '' };
    case 'INTEGER': return '';
    case 'BOOLEAN': return false;
    case 'ARRAY': return [];
    case 'OBJECT':
      return field.objectSchema
        ? Object.fromEntries(field.objectSchema.map(f => [f.key, makeInitialValue(f)]))
        : {};
    default: return '';
  }
}

function makeNewArrayItem(field) {
  if (field.subtype === 'STRING') return '';
  if (field.itemSchema) {
    return Object.fromEntries(field.itemSchema.map(f => [f.key, makeInitialValue(f)]));
  }
  return {};
}

// --- Load faction data into form state ---

function loadFactionData(schema, data, pathPrefix = '') {
  const formData = {};
  const enabledOptionals = {};

  for (const field of (schema || [])) {
    const fieldPath = pathPrefix ? `${pathPrefix}.${field.key}` : field.key;

    if (field.type === 'INTERNATIONALIZED_STRING') {
      const base = data?.[field.key] ?? data?.[`${field.key}_en`] ?? '';
      const hasData = base !== '' || LANG_CODES.some(c => data?.[`${field.key}_${c}`]);
      if (!hasData) continue;
      const obj = { value: base };
      for (const code of LANG_CODES) {
        const v = data?.[`${field.key}_${code}`];
        if (v !== undefined && v !== '') obj[code] = v;
      }
      formData[field.key] = obj;
      if (field.optional) enabledOptionals[fieldPath] = true;
      continue;
    }

    const val = data?.[field.key];
    if (val === undefined || val === null) continue;
    if (field.optional) enabledOptionals[fieldPath] = true;

    switch (field.type) {
      case 'ENUM':
      case 'STRING':
      case 'INTEGER':
      case 'BOOLEAN':
        formData[field.key] = val;
        break;
      case 'ARRAY': {
        if (!Array.isArray(val)) break;
        if (field.subtype === 'STRING') {
          formData[field.key] = [...val];
        } else if (field.itemSchema) {
          const items = [];
          for (let i = 0; i < val.length; i++) {
            const { formData: itemData, enabledOptionals: itemOpts } =
              loadFactionData(field.itemSchema, val[i], `${fieldPath}.${i}`);
            items.push(itemData);
            Object.assign(enabledOptionals, itemOpts);
          }
          formData[field.key] = items;
        }
        break;
      }
      case 'OBJECT':
        if (field.objectSchema) {
          const { formData: nested, enabledOptionals: nestedOpts } =
            loadFactionData(field.objectSchema, val, fieldPath);
          formData[field.key] = nested;
          Object.assign(enabledOptionals, nestedOpts);
        }
        break;
      default:
        formData[field.key] = val;
    }
  }

  return { formData, enabledOptionals };
}

// --- Output builder ---

function buildArrayItemOutput(field, item, enabledOptionals, pathPrefix) {
  if (field.subtype === 'STRING') return item;
  if (field.itemSchema) return buildOutput(field.itemSchema, item, enabledOptionals, pathPrefix);
  return item;
}

function buildOutput(schema, data, enabledOptionals, pathPrefix = '') {
  const result = {};
  for (const field of (schema || [])) {
    const fieldPath = pathPrefix ? `${pathPrefix}.${field.key}` : field.key;
    if (field.optional && !enabledOptionals[fieldPath]) continue;
    const val = data?.[field.key];

    switch (field.type) {
      case 'INTERNATIONALIZED_STRING': {
        const base = val?.value ?? '';
        if (base !== '') {
          result[field.key] = base;
          result[`${field.key}_en`] = base;
          for (const code of LANG_CODES) {
            if (val?.[code] && val[code] !== '') result[`${field.key}_${code}`] = val[code];
          }
        }
        break;
      }
      case 'ENUM':
      case 'STRING':
        if (val !== '' && val !== undefined && val !== null) result[field.key] = val;
        break;
      case 'INTEGER':
        if (val !== '' && val !== undefined && val !== null) result[field.key] = Number(val);
        break;
      case 'BOOLEAN':
        result[field.key] = !!val;
        break;
      case 'ARRAY': {
        const items = Array.isArray(val) ? val : [];
        if (field.subtype === 'STRING') {
          const filtered = items.filter(v => v !== '');
          if (filtered.length > 0) result[field.key] = filtered;
        } else {
          result[field.key] = items.map((item, i) =>
            buildArrayItemOutput(field, item, enabledOptionals, `${fieldPath}.${i}`)
          );
        }
        break;
      }
      case 'OBJECT':
        if (field.objectSchema && val) {
          result[field.key] = buildOutput(field.objectSchema, val, enabledOptionals, fieldPath);
        }
        break;
      default:
        if (val !== '' && val !== undefined && val !== null) result[field.key] = val;
    }
  }
  return result;
}

// --- InternationalizedStringInput ---

function InternationalizedStringInput({ value, onChange }) {
  const [expanded, setExpanded] = useState(false);
  const val = value || { value: '' };
  const update = patch => onChange({ ...val, ...patch });

  return (
    <div className="cb-ss">
      <div className="cb-ss__row">
        <input
          className="cb-input cb-input--grow"
          type="text"
          placeholder="Text"
          value={val.value}
          onChange={e => update({ value: e.target.value })}
        />
        <button
          type="button"
          className={`cb-btn cb-btn--globe${expanded ? ' cb-btn--globe-on' : ''}`}
          title="Translations"
          onClick={() => setExpanded(!expanded)}
        >
          🌐
        </button>
      </div>
      {expanded && (
        <div className="cb-ss__translations">
          <div className="cb-ss__lang-row cb-ss__lang-row--auto">
            <span className="cb-ss__lang-code">EN (auto)</span>
            <input className="cb-input cb-input--grow" type="text" value={val.value} disabled />
          </div>
          {LANG_CODES.map(code => (
            <div key={code} className="cb-ss__lang-row">
              <span className="cb-ss__lang-code" title={LANG_LABELS[code]}>{code.toUpperCase()}</span>
              <input
                className="cb-input cb-input--grow"
                type="text"
                placeholder={LANG_LABELS[code]}
                value={val[code] || ''}
                onChange={e => update({ [code]: e.target.value })}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- ArrayField ---

function ArrayField({ field, value, onChange, enabledOptionals, onToggleOptional, pathPrefix }) {
  const items = Array.isArray(value) ? value : [];
  const updateItem = (i, v) => onChange(items.map((it, idx) => idx === i ? v : it));
  const removeItem = (i) => onChange(items.filter((_, idx) => idx !== i));
  const addItem = () => onChange([...items, makeNewArrayItem(field)]);

  if (field.subtype === 'STRING') {
    return (
      <div className="cb-array">
        {items.map((item, i) => (
          <div key={i} className="cb-array__item">
            <div className="cb-array__hdr">
              <span className="cb-array__idx">#{i + 1}</span>
              <button type="button" className="cb-btn cb-btn--rm" onClick={() => removeItem(i)}>✕</button>
            </div>
            <input
              className="cb-input cb-input--text"
              type="text"
              value={item || ''}
              onChange={e => updateItem(i, e.target.value)}
            />
          </div>
        ))}
        <button type="button" className="cb-btn cb-btn--add" onClick={addItem}>
          + Add {field.name_en}
        </button>
      </div>
    );
  }

  return (
    <div className="cb-array">
      {items.map((item, i) => (
        <div key={i} className="cb-array__item">
          <div className="cb-array__hdr">
            <span className="cb-array__idx">#{i + 1}</span>
            <button type="button" className="cb-btn cb-btn--rm" onClick={() => removeItem(i)}>✕</button>
          </div>
          {field.itemSchema?.length ? (
            <SchemaForm
              schema={field.itemSchema}
              data={item}
              onChange={v => updateItem(i, v)}
              enabledOptionals={enabledOptionals}
              onToggleOptional={onToggleOptional}
              pathPrefix={`${pathPrefix}.${i}`}
            />
          ) : null}
        </div>
      ))}
      <button type="button" className="cb-btn cb-btn--add" onClick={addItem}>
        + Add {field.name_en}
      </button>
    </div>
  );
}

// --- FieldInput ---

function FieldInput({ field, value, onChange, enabledOptionals, onToggleOptional, pathPrefix }) {
  switch (field.type) {
    case 'INTERNATIONALIZED_STRING':
      return <InternationalizedStringInput value={value} onChange={onChange} />;
    case 'ENUM':
    case 'STRING':
      return (
        <input
          className="cb-input cb-input--text"
          type="text"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
        />
      );
    case 'INTEGER':
      return (
        <input
          className="cb-input cb-input--number"
          type="number"
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
        />
      );
    case 'BOOLEAN':
      return (
        <label className="cb-bool">
          <input
            type="checkbox"
            checked={!!value}
            onChange={e => onChange(e.target.checked)}
          />
          <span className="cb-bool__label">{value ? 'true' : 'false'}</span>
        </label>
      );
    case 'ARRAY':
      return (
        <ArrayField
          field={field}
          value={value}
          onChange={onChange}
          enabledOptionals={enabledOptionals}
          onToggleOptional={onToggleOptional}
          pathPrefix={pathPrefix}
        />
      );
    case 'OBJECT':
      return field.objectSchema ? (
        <div className="cb-object">
          <SchemaForm
            schema={field.objectSchema}
            data={value || {}}
            onChange={onChange}
            enabledOptionals={enabledOptionals}
            onToggleOptional={onToggleOptional}
            pathPrefix={pathPrefix}
          />
        </div>
      ) : null;
    default:
      return null;
  }
}

// --- SchemaForm ---

function SchemaForm({ schema, data, onChange, enabledOptionals, onToggleOptional, pathPrefix = '' }) {
  const update = (key, val) => onChange({ ...(data || {}), [key]: val });

  return (
    <div className="cb-schema-form">
      {schema.map(field => {
        const fieldPath = pathPrefix ? `${pathPrefix}.${field.key}` : field.key;
        const enabled = !field.optional || !!enabledOptionals[fieldPath];
        return (
          <div key={field.key} className={`cb-field${field.optional ? ' cb-field--opt' : ''}`}>
            <div className="cb-field__lbl-row">
              {field.optional && (
                <input
                  type="checkbox"
                  className="cb-opt-check"
                  checked={!!enabledOptionals[fieldPath]}
                  onChange={() => onToggleOptional(fieldPath)}
                  title="Enable optional field"
                />
              )}
              <span className="cb-field__lbl">{field.name_en}</span>
              {field.type === 'ENUM' && <span className="cb-badge">enum</span>}
              {field.optional && <span className="cb-badge">optional</span>}
            </div>
            {enabled && (
              <div className="cb-field__body">
                <FieldInput
                  field={field}
                  value={data?.[field.key]}
                  onChange={val => update(field.key, val)}
                  enabledOptionals={enabledOptionals}
                  onToggleOptional={onToggleOptional}
                  pathPrefix={fieldPath}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// --- Custom faction manager ---

function CustomFactionManager({ onLoad, onClose }) {
  const dispatch = useDispatch();
  const customFactions = useSelector((state) => state.customFactions);

  const rulesetNameFor = (rulesetId) =>
    factions.find((r) => r.id === rulesetId)?.name_en || rulesetId;

  const handleDelete = (faction) => {
    if (!window.confirm(`Delete "${faction.name_en || faction.id}"? This cannot be undone.`)) return;
    dispatch(deleteCustomFaction({ rulesetId: faction.rulesetId, id: faction.id }));
  };

  return (
    <div className="cb-browser">
      <div className="cb-browser__bar">
        <span className="cb-browser__title">My Custom Factions</span>
        <button type="button" className="cb-btn cb-btn--rm" onClick={onClose} title="Close">✕</button>
      </div>
      <div className="cb-browser__col" style={{ maxHeight: 280, borderRight: 'none' }}>
        {customFactions.length === 0 && (
          <span className="cb-browser__status">No custom factions saved yet.</span>
        )}
        {customFactions.map((f) => (
          <div key={`${f.rulesetId}/${f.id}`} className="fb-custom-row">
            <div className="fb-custom-row__info">
              <span className="fb-custom-row__name">{f.name_en || f.name || f.id}</span>
              <span className="fb-custom-row__meta">{rulesetNameFor(f.rulesetId)} · {f.id}</span>
            </div>
            <div className="fb-custom-row__actions">
              <button type="button" className="cb-btn" onClick={() => { onLoad(f); onClose(); }}>
                Load
              </button>
              <button type="button" className="cb-btn cb-btn--rm" onClick={() => handleDelete(f)}>
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Browse panel ---

function FactionBrowser({ onLoad, onClose }) {
  const [rulesetId, setRulesetId] = useState(factions[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const ruleset = factions.find(r => r.id === rulesetId);

  const selectFaction = async (rid, fid) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${process.env.PUBLIC_URL}/games/${rid}/${fid}/${fid}.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      onLoad(await res.json());
    } catch {
      setError('Could not load faction data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cb-browser">
      <div className="cb-browser__bar">
        <span className="cb-browser__title">Browse Existing Factions</span>
        <button type="button" className="cb-btn cb-btn--rm" onClick={onClose} title="Close">✕</button>
      </div>

      <div className="cb-browser__rulesets">
        {factions.map(r => (
          <button
            key={r.id}
            type="button"
            className={`cb-browser__rs${r.id === rulesetId ? ' cb-browser__rs--active' : ''}`}
            onClick={() => { setRulesetId(r.id); setError(null); }}
          >
            {r.name_en}
          </button>
        ))}
      </div>

      <div className="cb-browser__cols">
        <div className="cb-browser__col">
          <p className="cb-browser__col-hdr">Faction</p>
          {loading && <span className="cb-browser__status">Loading…</span>}
          {error && <span className="cb-browser__error">{error}</span>}
          {!loading && ruleset?.nations.map(n => (
            <button
              key={n.id}
              type="button"
              className="cb-browser__item"
              onClick={() => selectFaction(rulesetId, n.id)}
            >
              {n.name_en}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Main page ---

const schema = parseSchema(factionMeta);

export function FactionBuilder() {
  const dispatch = useDispatch();
  const [rulesetId, setRulesetId] = useState(factions[0]?.id || '');
  const [formData, setFormData] = useState({});
  const [enabledOptionals, setEnabledOptionals] = useState({});
  const [browsing, setBrowsing] = useState(false);
  const [managingCustom, setManagingCustom] = useState(false);
  const fileInputRef = useRef(null);

  const toggleOptional = path => {
    setEnabledOptionals(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const handleNew = () => {
    setFormData({});
    setEnabledOptionals({});
    setBrowsing(false);
  };

  const loadFaction = (data) => {
    const { formData: fd, enabledOptionals: eo } = loadFactionData(schema, data);
    if (data.rulesetId) setRulesetId(data.rulesetId);
    setFormData(fd);
    setEnabledOptionals(eo);
    setBrowsing(false);
  };

  const handleSave = () => {
    const output = buildOutput(schema, formData, enabledOptionals);
    if (!output.id) {
      alert('Please fill in the ID field before saving.');
      return;
    }
    if (!rulesetId) {
      alert('Please select a ruleset before saving.');
      return;
    }
    dispatch(saveCustomFaction({ ...output, rulesetId }));
    alert(`Faction "${output.id}" saved to ruleset "${rulesetId}".`);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        loadFaction(JSON.parse(evt.target.result));
      } catch {
        alert('Could not parse JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const outputJson = useMemo(
    () => JSON.stringify(buildOutput(schema, formData, enabledOptionals), null, 2),
    [formData, enabledOptionals]
  );

  return (
    <>
      <Header />
      <div className="cb-page">
        <div className="cb-toolbar">
          <button type="button" className="cb-btn cb-toolbar__btn" onClick={handleNew}>
            New Faction
          </button>
          <button
            type="button"
            className="cb-btn cb-toolbar__btn"
            onClick={() => fileInputRef.current?.click()}
          >
            Open File…
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <button
            type="button"
            className={`cb-btn cb-toolbar__btn${browsing ? ' cb-toolbar__btn--on' : ''}`}
            onClick={() => { setBrowsing(b => !b); setManagingCustom(false); }}
          >
            Browse Existing…
          </button>
          <button
            type="button"
            className={`cb-btn cb-toolbar__btn${managingCustom ? ' cb-toolbar__btn--on' : ''}`}
            onClick={() => { setManagingCustom(b => !b); setBrowsing(false); }}
          >
            My Factions…
          </button>
          <select
            className="cb-input fb-ruleset-select"
            value={rulesetId}
            onChange={(e) => setRulesetId(e.target.value)}
            title="Ruleset this faction belongs to"
          >
            {factions.map((r) => (
              <option key={r.id} value={r.id}>{r.name_en}</option>
            ))}
          </select>
          <button type="button" className="cb-btn cb-toolbar__btn fb-save-btn" onClick={handleSave}>
            Save Faction
          </button>
        </div>

        {browsing && (
          <FactionBrowser onLoad={loadFaction} onClose={() => setBrowsing(false)} />
        )}
        {managingCustom && (
          <CustomFactionManager onLoad={loadFaction} onClose={() => setManagingCustom(false)} />
        )}

        <div className="cb-layout">
          <section className="cb-form-col">
            <h2 className="cb-col-title">Faction Fields</h2>
            <SchemaForm
              schema={schema}
              data={formData}
              onChange={setFormData}
              enabledOptionals={enabledOptionals}
              onToggleOptional={toggleOptional}
            />
          </section>

          <section className="cb-json-col">
            <h2 className="cb-col-title">JSON Output</h2>
            <pre className="cb-json-out fb-json-out">{outputJson}</pre>
          </section>
        </div>
      </div>
    </>
  );
}
