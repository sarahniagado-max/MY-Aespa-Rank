const supabaseUrl = 'https://pgeobkizrwysefxehves.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnZW9ia2l6cnd5c2VmeGVodmVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MjkwMDEsImV4cCI6MjA4OTUwNTAwMX0.zVZpftZ2ifyFcC73yT6aYS4ZdpzpKyzgrLWCUVytV-Q';

async function query(table, options = {}) {
  const { method = 'GET', filter, orderBy, limit = 1000, body } = options;
  let url = `${supabaseUrl}/rest/v1/${table}?`;
  if (orderBy) url += `order=${orderBy}.asc&`;
  if (limit) url += `limit=${limit}&`;
  if (filter)
    Object.entries(filter).forEach(([k, v]) => {
      url += `${k}=eq.${v}&`;
    });
  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    Prefer:
      method === 'POST' ? 'return=representation' : 'return=representation',
  };
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    console.error(`Supabase error on ${table}:`, await res.text());
    return method === 'GET' ? [] : null;
  }
  return res.json();
}

function createEntity(tableName) {
  return {
    async list(orderBy = 'created_at', limit = 1000) {
      return query(tableName, { orderBy, limit }) || [];
    },
    async filter(filters = {}, orderBy = 'created_at', limit = 1000) {
      return query(tableName, { filter: filters, orderBy, limit }) || [];
    },
    async get(id) {
      const r = await query(tableName, { filter: { id } });
      return r?.[0] || null;
    },
    async create(fields) {
      return query(tableName, { method: 'POST', body: fields });
    },
    async update(id, fields) {
      return query(tableName, {
        method: 'PATCH',
        filter: { id },
        body: fields,
      });
    },
    async delete(id) {
      await query(tableName, { method: 'DELETE', filter: { id } });
      return { success: true };
    },
  };
}

const entities = {};
[
  'Song',
  'Album',
  'UserRanking',
  'Battle',
  'SongTag',
  'Mood',
  'MoodRanking',
  'UserPersonalData',
  'Feedback',
  'User',
].forEach((name) => {
  const tableMap = {
    Song: 'songs',
    Album: 'albums',
    UserRanking: 'user_rankings',
    Battle: 'battles',
    SongTag: 'song_tags',
    Mood: 'moods',
    MoodRanking: 'mood_rankings',
    UserPersonalData: 'user_personal_data',
    Feedback: 'feedback',
    User: 'users',
  };
  entities[name] = createEntity(tableMap[name]);
});

function getOrCreateUserId() {
  let id = localStorage.getItem('aespa_user_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('aespa_user_id', id);
  }
  return id;
}

const auth = {
  async isAuthenticated() {
    return true;
  },
  async me() {
    const id = getOrCreateUserId();
    return { id, email: id };
  },
};
const integrations = {
  Core: {
    async UploadFile() {
      return { file_url: '' };
    },
  },
};

export const db = { auth, entities, integrations };
export const base44 = db;
export default db;
