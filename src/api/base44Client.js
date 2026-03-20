import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pgeobkizrwysefxehves.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnZW9ia2l6cnd5c2VmeGVodmVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MjkwMDEsImV4cCI6MjA4OTUwNTAwMX0.zVZpftZ2ifyFcC73yT6aYS4ZdpzpKyzgrLWCUVytV-Q';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TABLE_MAP = {
  Song: 'songs', Album: 'albums', UserRanking: 'user_rankings',
  Battle: 'battles', SongTag: 'song_tags', Mood: 'moods',
  MoodRanking: 'mood_rankings', UserPersonalData: 'user_personal_data',
  Feedback: 'feedback', User: 'users',
};

function createEntity(tableName) {
  return {
    async list(orderBy = 'created_at', limit = 1000) {
      const { data, error } = await supabase.from(tableName).select('*').order(orderBy, { ascending: true }).limit(limit);
      if (error) { console.error(`Error listing ${tableName}:`, error); return []; }
      return data || [];
    },
    async filter(filters = {}, orderBy = 'created_at', limit = 1000) {
      let query = supabase.from(tableName).select('*');
      Object.entries(filters).forEach(([key, value]) => { if (value !== undefined && value !== null) query = query.eq(key, value); });
      const { data, error } = await query.order(orderBy, { ascending: true }).limit(limit);
      if (error) { console.error(`Error filtering ${tableName}:`, error); return []; }
      return data || [];
    },
    async get(id) {
      const { data, error } = await supabase.from(tableName).select('*').eq('id', id).single();
      if (error) { console.error(`Error getting ${tableName}:`, error); return null; }
      return data;
    },
    async create(fields) {
      const { data, error } = await supabase.from(tableName).insert([fields]).select().single();
      if (error) { console.error(`Error creating ${tableName}:`, error); throw error; }
      return data;
    },
    async update(id, fields) {
      const { data, error } = await supabase.from(tableName).update(fields).eq('id', id).select().single();
      if (error) { console.error(`Error updating ${tableName}:`, error); throw error; }
      return data;
    },
    async delete(id) {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) { console.error(`Error deleting ${tableName}:`, error); throw error; }
      return { success: true };
    },
  };
}

const entities = {};
Object.entries(TABLE_MAP).forEach(([entityName, tableName]) => { entities[entityName] = createEntity(tableName); });

const auth = { async isAuthenticated() { return false; }, async me() { return null; } };
const integrations = { Core: { async Upload