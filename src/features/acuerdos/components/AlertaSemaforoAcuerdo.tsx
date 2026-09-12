interface AlertaSemaforoAcuerdoProps {
  tiempoConsumido: number;
}

export function AlertaSemaforoAcuerdo({ tiempoConsumido }: AlertaSemaforoAcuerdoProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {/* Verde */}
        <div
          className={`h-3 w-3 rounded-full border border-success-500 ${
            tiempoConsumido < 50 ? 'bg-success-500' : 'bg-transparent'
          }`}
          title={tiempoConsumido < 50 ? `${tiempoConsumido}% - Alerta Verde` : 'Verde'}
        />
        {/* Amarillo */}
        <div
          className={`h-3 w-3 rounded-full border border-warning-500 ${
            tiempoConsumido >= 50 && tiempoConsumido < 80 ? 'bg-warning-500' : 'bg-transparent'
          }`}
          title={tiempoConsumido >= 50 && tiempoConsumido < 80 ? `${tiempoConsumido}% - Alerta Amarilla` : 'Amarillo'}
        />
        {/* Rojo */}
        <div
          className={`h-3 w-3 rounded-full border border-danger-500 ${
            tiempoConsumido >= 80 ? 'bg-danger-500' : 'bg-transparent'
          }`}
          title={tiempoConsumido >= 80 ? `${tiempoConsumido}% - Alerta Roja` : 'Rojo'}
        />
      </div>
      <span className="text-xs text-gray-600">{tiempoConsumido}%</span>
    </div>
  );
}
