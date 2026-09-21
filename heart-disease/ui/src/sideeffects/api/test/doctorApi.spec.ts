import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '../api';
import { bookAppointment, fetchAvailableSlots, requestAppointment, searchLocalDoctors } from '../doctorApi';

describe('doctorApi', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads available local appointment slots for a doctor', async () => {
    const getSpy = vi.spyOn(api, 'get').mockResolvedValue({
      data: [{ id: 'slot-1', doctor_id: 'doctor-1' }],
    });

    await expect(fetchAvailableSlots('doctor-1')).resolves.toEqual([{ id: 'slot-1', doctor_id: 'doctor-1' }]);
    expect(getSpy).toHaveBeenCalledWith('/doctors/doctor-1/slots');
  });

  it('posts the selected slot and insurance when booking', async () => {
    const postSpy = vi.spyOn(api, 'post').mockResolvedValue({
      data: { id: 'booking-1', status: 'confirmed' },
    });

    await expect(bookAppointment('doctor-1', 'slot-1', 'Blue Cross')).resolves.toMatchObject({ status: 'confirmed' });
    expect(postSpy).toHaveBeenCalledWith('/doctors/doctor-1/bookings', { slot_id: 'slot-1', insurance: 'Blue Cross' });
  });

  it('searches the real local doctor directory by postal code and specialty', async () => {
    const getSpy = vi.spyOn(api, 'get').mockResolvedValue({
      data: [{ npi: '1234567890', specialty: 'Cardiology' }],
    });

    await expect(searchLocalDoctors('94105', 'Cardiology')).resolves.toEqual([
      { npi: '1234567890', specialty: 'Cardiology' },
    ]);
    expect(getSpy).toHaveBeenCalledWith('/local-doctors/search', {
      params: { postal_code: '94105', specialty: 'Cardiology' },
    });
  });

  it('submits a request-to-book for an external provider', async () => {
    const postSpy = vi.spyOn(api, 'post').mockResolvedValue({
      data: { id: 'req-1', status: 'pending_contact' },
    });

    const payload = {
      provider_npi: '1234567890',
      provider_name: 'Dr. Alex Rivera',
      provider_phone: '555-010-1234',
      specialty: 'Cardiology',
      insurance: 'Blue Cross',
    };

    await expect(requestAppointment(payload)).resolves.toMatchObject({ status: 'pending_contact' });
    expect(postSpy).toHaveBeenCalledWith('/local-doctors/requests', payload);
  });
});
