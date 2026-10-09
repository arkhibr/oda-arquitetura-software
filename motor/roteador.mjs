export function abaDoHash(hash, ids) {
  const id = String(hash ?? '').replace(/^#/, '');
  return ids.includes(id) ? id : ids[0];
}

export function vizinhas(ids, atual) {
  const i = ids.indexOf(atual);
  return { anterior: i > 0 ? ids[i - 1] : null, proxima: i >= 0 && i < ids.length - 1 ? ids[i + 1] : null };
}

export function progresso(ids, concluida) {
  const feitas = ids.filter((id) => concluida(id)).length;
  return { feitas, total: ids.length, percentual: Math.round((feitas * 100) / ids.length) };
}
