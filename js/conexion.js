// js/conexion.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Tus credenciales de Supabase
const supabaseUrl = 'https://cesvouuntzlvuhnwppnk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlc3ZvdXVudHpsdnVobndwcG5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NjE2MjcsImV4cCI6MjA5NjMzNzYyN30.TWV_hdvMbaXDNxBf9v2Q5YWP2BNYLevr4EmXgwmWElU';

export const supabase = createClient(supabaseUrl, supabaseKey);

