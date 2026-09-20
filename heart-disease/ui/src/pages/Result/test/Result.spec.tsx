import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import ResultPage from '../index';
import { renderWithProviders } from '../../../test/renderWithProviders';

const patientData = {
  age: 63, sex: 1, cp: 3, trestbps: 145, chol: 233, fbs: 1,
  restecg: 0, thalach: 150, exang: 0, oldpeak: 2.3, slope: 0, ca: 0, thal: 1,
};

describe('ResultPage', () => {
  it('prompts the user to find a doctor after an elevated result', () => {
    renderWithProviders(<ResultPage />, {
      route: '/result',
      preloadedState: {
        prediction: {
          currentResult: {
            probability: 0.82,
            prediction: 1,
            risk_level: 'high',
            top_factors: [],
            population_percentiles: [],
          },
          currentPatientData: patientData,
          history: [],
          loading: false,
          error: null,
        },
      },
    });

    expect(screen.getByRole('heading', { name: 'Review your result with a doctor' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Find Doctors' })).toBeInTheDocument();
  });
});

