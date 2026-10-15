import { supabase } from '../config/supabase.js';

/**
 * Obtiene todas las reservas ordenadas por fecha y hora_inicio ascendente.
 * Si se envía el query param ?fecha=YYYY-MM-DD, filtra por esa fecha.
 */
export const getReservas = async (req, res) => {
  try {
    const { fecha } = req.query;

    let query = supabase
      .from('reservas')
      .select('*')
      .order('fecha', { ascending: true })
      .order('hora_inicio', { ascending: true });

    if (fecha) {
      query = query.eq('fecha', fecha);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Error al obtener las reservas.' });
  }
};

/**
 * Crea una nueva reserva validando campos, orden horario y solapamiento.
 */
export const crearReserva = async (req, res) => {
  try {
    const { cliente_nombre, cliente_email, fecha, hora_inicio, hora_fin } = req.body;

    // Validación de campos requeridos
    if (!cliente_nombre || !cliente_email || !fecha || !hora_inicio || !hora_fin) {
      return res.status(400).json({
        error: 'Todos los campos son requeridos: cliente_nombre, cliente_email, fecha, hora_inicio, hora_fin.'
      });
    }

    // Validación de horario: hora_inicio debe ser menor que hora_fin
    if (hora_inicio >= hora_fin) {
      return res.status(400).json({
        error: 'La hora de inicio debe ser menor que la hora de fin.'
      });
    }

    // Lógica de solapamiento:
    // (hora_inicio < nueva_hora_fin AND hora_fin > nueva_hora_inicio)
    const { data: solapadas, error: checkError } = await supabase
      .from('reservas')
      .select('*')
      .eq('fecha', fecha)
      .eq('estado', 'confirmada')
      .lt('hora_inicio', hora_fin)
      .gt('hora_fin', hora_inicio);

    if (checkError) {
      return res.status(500).json({ error: checkError.message });
    }

    if (solapadas && solapadas.length > 0) {
      return res.status(409).json({
        error: 'El horario seleccionado ya se encuentra reservado.'
      });
    }

    // Insertar la nueva reserva
    const { data: nuevaReserva, error: insertError } = await supabase
      .from('reservas')
      .insert([
        {
          cliente_nombre,
          cliente_email,
          fecha,
          hora_inicio,
          hora_fin,
          estado: 'confirmada'
        }
      ])
      .select();

    if (insertError) {
      return res.status(500).json({ error: insertError.message });
    }

    return res.status(201).json(nuevaReserva[0] || nuevaReserva);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Error al crear la reserva.' });
  }
};

/**
 * Cancela una reserva por ID cambiando su estado a 'cancelada'.
 */
export const cancelarReserva = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'El ID de la reserva es requerido.' });
    }

    const { data, error } = await supabase
      .from('reservas')
      .update({ estado: 'cancelada' })
      .eq('id', id)
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada.' });
    }

    return res.status(200).json(data[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Error al cancelar la reserva.' });
  }
};
