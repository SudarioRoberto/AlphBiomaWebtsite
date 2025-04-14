export async function generateUniqueProjectId(supabase) {
  let id;
  let exists = true;

  while (exists) {
    const random = Math.floor(1000 + Math.random() * 9000); // 4 dígitos
    id = `AB${random}`; // Você pode mudar "AB" para algo personalizado

    const { data } = await supabase
      .from('projects')
      .select('id')
      .eq('project_id', id)
      .maybeSingle();

    exists = !!data;
  }

  return id;
}
