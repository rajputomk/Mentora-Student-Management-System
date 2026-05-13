const url = 'https://pqbgmuaowlqrnhbsfita.supabase.co/rest/v1/';
const key = 'sb_publishable_vLC0En3Mqjzgw3eA6-dVpw_IeQZq4jW';

fetch(url, { headers: { apikey: key } })
  .then(r => r.json())
  .then(data => console.log(JSON.stringify(data, null, 2)))
  .catch(e => console.error(e));
