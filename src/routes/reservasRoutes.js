import { Router } from 'express';
import {
  getReservas,
  crearReserva,
  cancelarReserva
} from '../controllers/reservasController.js';

const router = Router();

router.get('/', getReservas);
router.post('/', crearReserva);
router.delete('/:id', cancelarReserva);

export default router;
