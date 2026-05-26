import { useState, useMemo, useRef } from 'react';
import DOMPurify from 'dompurify';
import { useSelector, useDispatch } from 'react-redux';
import { Header } from '../../components/page';
import factions from '../../assets/factions.json';
import { saveCustomCard, deleteCustomCard } from '../../state/customCards';
import negligibleMeta from '../../utils/card/db/all_negligible_meta.json';
import lightMeta from '../../utils/card/db/all_light_meta.json';
import mediumMeta from '../../utils/card/db/all_medium_meta.json';
import heavyMeta from '../../utils/card/db/all_heavy_meta.json';
import { heavyCard } from '../../utils/card/heavy';
import { lightCard } from '../../utils/card/light';
import { mediumCard } from '../../utils/card/medium';
import { negligibleCard } from '../../utils/card/negligible';
import { tremendousCard } from '../../utils/card/tremendous';
import './CardBuilder.css';

const LANGUAGES = [
  { code: 'pi', label: 'Pirate' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'it', label: 'Italiano' },
  { code: 'pl', label: 'Polski' },
];

const WEIGHTS = ['negligible', 'light', 'medium', 'heavy', 'tremendous'];

const META_BY_WEIGHT = {
  negligible: negligibleMeta,
  light: lightMeta,
  medium: mediumMeta,
  heavy: heavyMeta,
};

const DEFAULT_META = {
  bgColor: '#d4c5a0',
  fgColor: '#ffffff',
  waterColor: '#7fb3c8',
  accentColor: '#c8a020',
  parchmentColor: '#f5e6b8',
};

const CARD_SCALE = 0.70;

function tryRenderCard(weight, obj) {
  try {
    switch (weight) {
      case 'heavy': return heavyCard(DEFAULT_META, obj, {});
      case 'light': return lightCard(DEFAULT_META, obj, {});
      case 'medium': return mediumCard(DEFAULT_META, obj, {});
      case 'negligible': return negligibleCard(DEFAULT_META, obj, {});
      case 'tremendous': return tremendousCard(DEFAULT_META, obj, {});
      default: return null;
    }
  } catch {
    return null;
  }
}

function CardPreview({ weight, cardObj }) {
  const html = useMemo(() => {
    const raw = tryRenderCard(weight, cardObj);
    return raw ? DOMPurify.sanitize(raw) : null;
  }, [weight, cardObj]);

  if (!html) {
    return (
      <div className="cb-card-preview cb-card-preview--empty">
        <span className="cb-card-preview__msg">Fill in required fields to preview</span>
      </div>
    );
  }

  return (
    <div className="cb-card-preview">
      <div
        className="cb-card-preview__inner"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

const VERTICAL_TITLE_SCHEMA = [
  { key: 'title', name_en: 'Title', type: 'STRING', optional: false },
  { key: 'height', name_en: 'Height (%)', type: 'INTEGER', optional: false },
];

const HORIZONTAL_TITLE_SCHEMA = [
  { key: 'title', name_en: 'Title', type: 'STRING', optional: false },
  { key: 'width', name_en: 'Width (%)', type: 'INTEGER', optional: false },
];

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
      field.itemSchema = parseSchema(example[0]);
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
    case 'INTEGER': return '';
    case 'BOOLEAN': return false;
    case 'SCALED_STRING': return { value: '', scale: 1.0 };
    case 'ARRAY': return [];
    case 'OBJECT':
      return field.objectSchema
        ? Object.fromEntries(field.objectSchema.map(f => [f.key, makeInitialValue(f)]))
        : {};
    default: return '';
  }
}

function makeNewArrayItem(field) {
  if (field.subtype === 'SCALED_STRING') return { value: '', scale: 1.0 };
  if (field.subtype === 'VERTICAL_TITLE') return { title: '', height: 50 };
  if (field.subtype === 'HORIZONTAL_TITLE') return { title: '', width: 50 };
  if (field.itemSchema) {
    return Object.fromEntries(field.itemSchema.map(f => [f.key, makeInitialValue(f)]));
  }
  return {};
}

// --- Load existing card data into form state ---
// Walks the schema and card JSON together, returning formData and which
// optional paths are present (and should therefore be enabled).

function loadCardData(schema, cardData, pathPrefix = '') {
  const formData = {};
  const enabledOptionals = {};

  for (const field of (schema || [])) {
    if (field.type === 'ENUM') continue;
    const val = cardData?.[field.key];
    if (val === undefined || val === null) continue;

    const fieldPath = pathPrefix ? `${pathPrefix}.${field.key}` : field.key;
    if (field.optional) enabledOptionals[fieldPath] = true;

    switch (field.type) {
      case 'SCALED_STRING':
        formData[field.key] = { ...val };
        break;
      case 'ARRAY': {
        if (!Array.isArray(val)) break;
        if (
          field.subtype === 'SCALED_STRING' ||
          field.subtype === 'VERTICAL_TITLE' ||
          field.subtype === 'HORIZONTAL_TITLE'
        ) {
          formData[field.key] = val.map(item => ({ ...item }));
        } else if (field.itemSchema) {
          const items = [];
          for (let i = 0; i < val.length; i++) {
            const { formData: itemData, enabledOptionals: itemOpts } =
              loadCardData(field.itemSchema, val[i], `${fieldPath}.${i}`);
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
            loadCardData(field.objectSchema, val, fieldPath);
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

// --- Output builders ---

function buildScaledStringOutput(val) {
  const v = val?.value ?? '';
  const s = Number(val?.scale ?? 1.0);
  const out = { value: v, scale: s, value_en: v, scale_en: s };
  for (const { code } of LANGUAGES) {
    const lv = val?.[`value_${code}`];
    if (lv !== undefined && lv !== '') {
      out[`value_${code}`] = lv;
      out[`scale_${code}`] = Number(val?.[`scale_${code}`] ?? 1.0);
    }
  }
  return out;
}

function buildArrayItemOutput(field, item, enabledOptionals, pathPrefix) {
  if (field.subtype === 'SCALED_STRING') return buildScaledStringOutput(item);
  if (field.subtype === 'VERTICAL_TITLE') {
    return { title: item.title || '', title_en: item.title || '', height: Number(item.height) || 50 };
  }
  if (field.subtype === 'HORIZONTAL_TITLE') {
    return { title: item.title || '', title_en: item.title || '', width: Number(item.width) || 50 };
  }
  if (field.itemSchema) return buildOutput(field.itemSchema, item, enabledOptionals, pathPrefix);
  return item;
}

function buildOutput(schema, data, enabledOptionals, pathPrefix = '') {
  const result = {};
  for (const field of (schema || [])) {
    if (field.type === 'ENUM') continue;
    const fieldPath = pathPrefix ? `${pathPrefix}.${field.key}` : field.key;
    if (field.optional && !enabledOptionals[fieldPath]) continue;
    const val = data?.[field.key];
    switch (field.type) {
      case 'SCALED_STRING':
        result[field.key] = buildScaledStringOutput(val);
        break;
      case 'ARRAY':
        result[field.key] = (Array.isArray(val) ? val : []).map((item, i) =>
          buildArrayItemOutput(field, item, enabledOptionals, `${fieldPath}.${i}`)
        );
        break;
      case 'OBJECT':
        if (field.objectSchema && val) {
          result[field.key] = buildOutput(field.objectSchema, val, enabledOptionals, fieldPath);
        }
        break;
      case 'BOOLEAN':
        result[field.key] = !!val;
        break;
      case 'INTEGER':
        if (val !== '' && val !== undefined && val !== null) result[field.key] = Number(val);
        break;
      default:
        if (val !== '' && val !== undefined && val !== null) result[field.key] = val;
    }
  }
  return result;
}

// --- Custom card manager ---

function CustomCardManager({ onLoad, onClose }) {
  const dispatch = useDispatch();
  const customCards = useSelector((state) => state.customCards);
  const customFactions = useSelector((state) => state.customFactions);

  const factionNameFor = (rulesetId, factionId) =>
    customFactions.find((f) => f.rulesetId === rulesetId && f.id === factionId)?.name_en ||
    factionId;
  const rulesetNameFor = (rulesetId) =>
    factions.find((r) => r.id === rulesetId)?.name_en || rulesetId;

  const handleDelete = (card) => {
    if (!window.confirm(`Delete card "${card.id}" from faction "${card.factionId}"? This cannot be undone.`)) return;
    dispatch(deleteCustomCard({ rulesetId: card.rulesetId, factionId: card.factionId, id: card.id }));
  };

  return (
    <div className="cb-browser">
      <div className="cb-browser__bar">
        <span className="cb-browser__title">My Custom Cards</span>
        <button type="button" className="cb-btn cb-btn--rm" onClick={onClose} title="Close">✕</button>
      </div>
      <div className="cb-browser__col" style={{ maxHeight: 280, borderRight: 'none' }}>
        {customCards.length === 0 && (
          <span className="cb-browser__status">No custom cards saved yet.</span>
        )}
        {customCards.map((c) => (
          <div key={`${c.rulesetId}/${c.factionId}/${c.id}`} className="fb-custom-row">
            <div className="fb-custom-row__info">
              <span className="fb-custom-row__name">{c.id}</span>
              <span className="fb-custom-row__meta">
                {factionNameFor(c.rulesetId, c.factionId)} · {rulesetNameFor(c.rulesetId)}
              </span>
            </div>
            <div className="fb-custom-row__actions">
              {c.weight && (
                <span className={`cb-weight-badge cb-weight-badge--${c.weight}`}>{c.weight}</span>
              )}
              <button type="button" className="cb-btn" onClick={() => { onLoad(c); onClose(); }}>
                Load
              </button>
              <button type="button" className="cb-btn cb-btn--rm" onClick={() => handleDelete(c)}>
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

function CardBrowser({ onLoad, onClose }) {
  const [rulesetId, setRulesetId] = useState(factions[0]?.id || '');
  const [factionId, setFactionId] = useState('');
  const [factionIndex, setFactionIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const ruleset = factions.find(r => r.id === rulesetId);

  const selectFaction = async (rid, fid) => {
    setFactionId(fid);
    setFactionIndex(null);
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${process.env.PUBLIC_URL}/games/${rid}/${fid}.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setFactionIndex(await res.json());
    } catch (e) {
      setError('Could not load faction data.');
    } finally {
      setLoading(false);
    }
  };

  const selectCard = async (cardId) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${process.env.PUBLIC_URL}/games/${rulesetId}/${cardId}.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      onLoad(await res.json());
    } catch (e) {
      setError(`Could not load card "${cardId}".`);
      setLoading(false);
    }
  };

  const cards = [
    ...(factionIndex?.units || []),
    ...(factionIndex?.addons || []),
  ];

  return (
    <div className="cb-browser">
      <div className="cb-browser__bar">
        <span className="cb-browser__title">Browse Existing Cards</span>
        <button type="button" className="cb-btn cb-btn--rm" onClick={onClose} title="Close">✕</button>
      </div>

      <div className="cb-browser__rulesets">
        {factions.map(r => (
          <button
            key={r.id}
            type="button"
            className={`cb-browser__rs${r.id === rulesetId ? ' cb-browser__rs--active' : ''}`}
            onClick={() => { setRulesetId(r.id); setFactionId(''); setFactionIndex(null); setError(null); }}
          >
            {r.name_en}
          </button>
        ))}
      </div>

      <div className="cb-browser__cols">
        <div className="cb-browser__col">
          <p className="cb-browser__col-hdr">Faction</p>
          {ruleset?.nations.map(n => (
            <button
              key={n.id}
              type="button"
              className={`cb-browser__item${n.id === factionId ? ' cb-browser__item--active' : ''}`}
              onClick={() => selectFaction(rulesetId, n.id)}
            >
              {n.name_en}
            </button>
          ))}
        </div>

        <div className="cb-browser__col">
          <p className="cb-browser__col-hdr">Cards</p>
          {loading && <span className="cb-browser__status">Loading…</span>}
          {error && <span className="cb-browser__error">{error}</span>}
          {cards.map(c => (
            <button
              key={c.id}
              type="button"
              className="cb-browser__item cb-browser__card"
              onClick={() => selectCard(c.id)}
            >
              <span>{c.name_en}</span>
              {c.weight && <span className={`cb-weight-badge cb-weight-badge--${c.weight}`}>{c.weight}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Form components ---

function ScaledStringInput({ value, onChange }) {
  const [expanded, setExpanded] = useState(false);
  const val = value || { value: '', scale: 1.0 };
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
        <span className="cb-ss__scale-lbl">Scale</span>
        <input
          className="cb-input cb-input--scale"
          type="number"
          step="0.05"
          min="0.1"
          max="3"
          value={val.scale}
          onChange={e => update({ scale: e.target.value })}
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
            <input className="cb-input cb-input--scale" type="number" value={val.scale} disabled />
          </div>
          {LANGUAGES.map(({ code, label }) => (
            <div key={code} className="cb-ss__lang-row">
              <span className="cb-ss__lang-code" title={label}>{code.toUpperCase()}</span>
              <input
                className="cb-input cb-input--grow"
                type="text"
                placeholder={label}
                value={val[`value_${code}`] || ''}
                onChange={e => update({ [`value_${code}`]: e.target.value })}
              />
              <input
                className="cb-input cb-input--scale"
                type="number"
                step="0.05"
                value={val[`scale_${code}`] ?? 1.0}
                onChange={e => update({ [`scale_${code}`]: e.target.value })}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ArrayField({ field, value, onChange, enabledOptionals, onToggleOptional, pathPrefix }) {
  const items = Array.isArray(value) ? value : [];
  const updateItem = (i, v) => onChange(items.map((it, idx) => idx === i ? v : it));
  const removeItem = (i) => onChange(items.filter((_, idx) => idx !== i));
  const addItem = () => onChange([...items, makeNewArrayItem(field)]);

  const itemSchema =
    field.subtype === 'VERTICAL_TITLE' ? VERTICAL_TITLE_SCHEMA
    : field.subtype === 'HORIZONTAL_TITLE' ? HORIZONTAL_TITLE_SCHEMA
    : field.itemSchema;

  return (
    <div className="cb-array">
      {items.map((item, i) => (
        <div key={i} className="cb-array__item">
          <div className="cb-array__hdr">
            <span className="cb-array__idx">#{i + 1}</span>
            <button type="button" className="cb-btn cb-btn--rm" onClick={() => removeItem(i)}>✕</button>
          </div>
          {field.subtype === 'SCALED_STRING'
            ? <ScaledStringInput value={item} onChange={v => updateItem(i, v)} />
            : itemSchema?.length
              ? <SchemaForm
                  schema={itemSchema}
                  data={item}
                  onChange={v => updateItem(i, v)}
                  enabledOptionals={enabledOptionals}
                  onToggleOptional={onToggleOptional}
                  pathPrefix={`${pathPrefix}.${i}`}
                />
              : null}
        </div>
      ))}
      <button type="button" className="cb-btn cb-btn--add" onClick={addItem}>
        + Add {field.name_en}
      </button>
    </div>
  );
}

function FieldInput({ field, value, onChange, enabledOptionals, onToggleOptional, pathPrefix }) {
  switch (field.type) {
    case 'SCALED_STRING':
      return <ScaledStringInput value={value} onChange={onChange} />;
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

function SchemaForm({ schema, data, onChange, enabledOptionals, onToggleOptional, pathPrefix = '' }) {
  const update = (key, val) => onChange({ ...(data || {}), [key]: val });

  return (
    <div className="cb-schema-form">
      {schema
        .filter(f => f.type !== 'ENUM')
        .map(field => {
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

// --- Main page ---

export function CardBuilder() {
  const dispatch = useDispatch();
  const customFactions = useSelector((state) => state.customFactions);
  const [weight, setWeight] = useState('heavy');
  const [formData, setFormData] = useState({});
  const [enabledOptionals, setEnabledOptionals] = useState({});
  const [browsing, setBrowsing] = useState(false);
  const [managingCustom, setManagingCustom] = useState(false);
  const [saveRulesetId, setSaveRulesetId] = useState(factions[0]?.id || '');
  const [saveFactionId, setSaveFactionId] = useState('');
  const [saveCardId, setSaveCardId] = useState('');
  const fileInputRef = useRef(null);

  const schema = useMemo(() => {
    const meta = META_BY_WEIGHT[weight];
    return meta ? parseSchema(meta) : [];
  }, [weight]);

  const handleWeightChange = w => {
    if (!META_BY_WEIGHT[w]) return;
    setWeight(w);
    setFormData({});
    setEnabledOptionals({});
    setBrowsing(false);
  };

  const toggleOptional = path => {
    setEnabledOptionals(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const handleNew = () => {
    setFormData({});
    setEnabledOptionals({});
    setBrowsing(false);
  };

  const loadCard = (card) => {
    const cardWeight = card.weight;
    const targetWeight = META_BY_WEIGHT[cardWeight] ? cardWeight : weight;
    const cardSchema = parseSchema(META_BY_WEIGHT[targetWeight] || {});
    const { formData: fd, enabledOptionals: eo } = loadCardData(cardSchema, card);
    setWeight(targetWeight);
    setFormData(fd);
    setEnabledOptionals(eo);
    setBrowsing(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        loadCard(JSON.parse(evt.target.result));
      } catch {
        alert('Could not parse JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const cardObj = useMemo(
    () => ({ weight, ...buildOutput(schema, formData, enabledOptionals) }),
    [weight, schema, formData, enabledOptionals]
  );

  const outputJson = useMemo(
    () => JSON.stringify(cardObj, null, 2),
    [cardObj]
  );

  return (
    <>
      <Header />
      <div className="cb-page">
        <div className="cb-toolbar">
          <button type="button" className="cb-btn cb-toolbar__btn" onClick={handleNew}>
            New Card
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
            My Cards…
          </button>
        </div>

        {browsing && (
          <CardBrowser onLoad={loadCard} onClose={() => setBrowsing(false)} />
        )}
        {managingCustom && (
          <CustomCardManager onLoad={loadCard} onClose={() => setManagingCustom(false)} />
        )}

        <div className="cb-tabs">
          {WEIGHTS.map(w => (
            <button
              key={w}
              type="button"
              className={[
                'cb-tab',
                w === weight && 'cb-tab--active',
                !META_BY_WEIGHT[w] && 'cb-tab--na',
              ].filter(Boolean).join(' ')}
              onClick={() => handleWeightChange(w)}
              disabled={!META_BY_WEIGHT[w]}
            >
              {w.charAt(0).toUpperCase() + w.slice(1)}
            </button>
          ))}
        </div>

        <div className="cb-layout">
          <section className="cb-form-col">
            <h2 className="cb-col-title">Card Fields</h2>
            {META_BY_WEIGHT[weight] ? (
              <SchemaForm
                schema={schema}
                data={formData}
                onChange={setFormData}
                enabledOptionals={enabledOptionals}
                onToggleOptional={toggleOptional}
              />
            ) : (
              <p className="cb-na-msg">
                No schema defined for <strong>{weight}</strong> cards yet.
              </p>
            )}
          </section>

          <section className="cb-json-col">
            <h2 className="cb-col-title">Card Preview</h2>
            <CardPreview weight={weight} cardObj={cardObj} />
            <h2 className="cb-col-title">Save as Custom Card</h2>
            <div className="cb-save-card">
              <div className="cb-save-card__row">
                <label className="cb-save-card__lbl">Ruleset</label>
                <select
                  className="cb-input cb-save-card__select"
                  value={saveRulesetId}
                  onChange={(e) => { setSaveRulesetId(e.target.value); setSaveFactionId(''); }}
                >
                  {factions.map((r) => (
                    <option key={r.id} value={r.id}>{r.name_en}</option>
                  ))}
                </select>
              </div>
              <div className="cb-save-card__row">
                <label className="cb-save-card__lbl">Faction</label>
                <select
                  className="cb-input cb-save-card__select"
                  value={saveFactionId}
                  onChange={(e) => setSaveFactionId(e.target.value)}
                >
                  <option value="">— select custom faction —</option>
                  {customFactions
                    .filter((f) => f.rulesetId === saveRulesetId)
                    .map((f) => (
                      <option key={f.id} value={f.id}>{f.name_en || f.name || f.id}</option>
                    ))}
                </select>
              </div>
              <div className="cb-save-card__row">
                <label className="cb-save-card__lbl">Card ID</label>
                <input
                  type="text"
                  className="cb-input cb-save-card__select"
                  value={saveCardId}
                  onChange={(e) => setSaveCardId(e.target.value)}
                  placeholder="e.g. my-ship-name"
                />
              </div>
              <button
                type="button"
                className="cb-btn cb-save-card__btn"
                onClick={() => {
                  if (!saveCardId.trim()) { alert('Enter a Card ID before saving.'); return; }
                  if (!saveFactionId) { alert('Select a custom faction before saving.'); return; }
                  dispatch(saveCustomCard({ ...cardObj, id: saveCardId.trim(), factionId: saveFactionId, rulesetId: saveRulesetId }));
                  alert(`Card "${saveCardId.trim()}" saved to faction "${saveFactionId}".`);
                }}
              >
                Save Card
              </button>
            </div>
            <h2 className="cb-col-title">JSON Output</h2>
            <pre className="cb-json-out">{outputJson}</pre>
          </section>
        </div>
      </div>
    </>
  );
}
