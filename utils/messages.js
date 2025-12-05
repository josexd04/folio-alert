function normal(info) {
  const zona = info.zona || '';
  return `Num: ${info.folio} | Terminación: ${info.ultimos3} | Tipo: ${info.tipo}, Terminal: ${info.terminal}${zona ? `, Zona: ${zona}` : ''}`;
}

function cambio(info) {
  return `Folio con terminacion ${info.ultimos3} en terminal: ${info.terminal}`;
}

function ventaEspecial(info) {
  return `Folio con terminacion ${info.ultimos3} en terminal: ${info.terminal}`;
}

function cancel(ultimos3) {
  return `Se ha cancelado el folio terminación ${ultimos3}`;
}

module.exports = { normal, cambio, ventaEspecial, cancel };
