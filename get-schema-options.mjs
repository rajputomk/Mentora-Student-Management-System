const supabaseUrl = 'https://pqbgmuaowlqrnhbsfita.supabase.co';
const supabaseAnonKey = 'sb_publishable_vLC0En3Mqjzgw3eA6-dVpw_IeQZq4jW';

async function fetchSchema() {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseAnonKey}`);
    const data = await res.json();
    if (data && data.definitions) {
       const tables = Object.keys(data.definitions);
       console.log("All tables in spec:", tables.filter(t => !t.includes(' ')));
       const teacherTable = tables.find(t => t.toLowerCase().includes('teacher'));
       if (teacherTable) {
         console.log(`Columns for ${teacherTable}:`, Object.keys(data.definitions[teacherTable].properties));
       }
    } else {
       console.log("No definitions found", data);
    }
  } catch(e) {
     console.error("Failed:", e);
  }
}
fetchSchema();
