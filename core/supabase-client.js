// Подключение к Supabase
const SUPABASE_URL = 'https://legianiryweinxtsuqoh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ2lhbmlyeXdlaW54dHN1cW9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NTkzMzYsImV4cCI6MjA3NTUzNTMzNn0.eRUFRWr0z6Q3h5Sxbb3SQtt5x4cJeVW4u0UtDg0yrdA';

// Импортируем Supabase клиент (добавьте CDN в index.html)
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

window.supabaseClient = supabase;
