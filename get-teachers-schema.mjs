const supabaseUrl = 'https://pqbgmuaowlqrnhbsfita.supabase.co';
const supabaseAnonKey = 'sb_publishable_vLC0En3Mqjzgw3eA6-dVpw_IeQZq4jW';

async function fetchSchema() {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/teachers?select=*&limit=1`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log("Teachers table data:", data);
      if (data.length === 0) {
        console.log("Table is empty, trying to trigger a schema error to see columns...");
        const res2 = await fetch(`${supabaseUrl}/rest/v1/teachers?select=non_existent_column`, {
          headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${supabaseAnonKey}` }
        });
        console.log("Error response:", await res2.text());
      }
    } else {
      console.log("Error fetching teachers:", response.status, await response.text());
    }
  } catch(e) {
     console.error("Failed:", e);
  }
}
fetchSchema();
