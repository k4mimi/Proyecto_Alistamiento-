/**
 * Componente de Bandeja de RAPs No Asignados
 * 
 * Bandeja lateral que funciona como drop zone para desasignar RAPs.
 * Cuando un RAP se arrastra aquí desde un trimestre, se desasigna.
 */

import { useDrop } from 'react-dnd';
import TarjetaRAPSabana from './TarjetaRAPSabana';

// CORREGIR BandejaNoAsignados.jsx
const BandejaNoAsignados = ({ raps = [], onDesasignarRAP, onClickRAP }) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'RAP_SABANA',
    drop: (item) => {
      console.log('🎯 Drop en bandeja no asignados:', item);

      // CORRECCIÓN: Pasar solo id_rap e id_trimestre
      if (item.asignacion) {
        onDesasignarRAP(
          item.asignacion.id_rap || item.id_rap,
          item.asignacion.id_trimestre
        );
      } else {
        // Si no tiene asignación, solo pasar el id_rap
        // (aunque esto no debería pasar)
        console.warn('RAP sin asignación en bandeja:', item);
      }
      return { bandeja: 'no-asignados' };
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  // Manejar clic en un RAP
  const handleClickRAP = (rap) => {
    if (onClickRAP) {
      onClickRAP(rap);
    }
  };

  return (
    <div
      ref={drop}
      className={`sabana-bandeja-no-asignados ${isOver && canDrop ? 'bandeja-over' : ''}`}
    >
      <div className="bandeja-header">
        <h3 className="bandeja-titulo">RAPs No Asignados</h3>
        <span className="bandeja-contador">
          {raps.length} RAP{raps.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="bandeja-cards">
        {raps.length > 0 ? (
          raps.map((rap) => (
            <div 
              key={`no-asignado-${rap.id_rap}`}
              className="rap-item-container"
              onClick={() => handleClickRAP(rap)}
              style={{ cursor: 'pointer' }} // Indicar que es clickeable
            >
              <TarjetaRAPSabana
                rap={rap}
                asignacion={null}
              />
            </div>
          ))
        ) : (
          <div className="bandeja-vacio">
            Todos los RAPs están asignados
          </div>
        )}
      </div>
    </div>
  );
};

export default BandejaNoAsignados;