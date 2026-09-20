import { describe, expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import PredictPage from '../index';
import { renderWithProviders } from '../../../test/renderWithProviders';

describe('PredictPage', () => {
  it('shows the branded validation summary and field errors without a toast', () => {
    renderWithProviders(<PredictPage />, { route: '/predict' });

    fireEvent.click(screen.getByRole('button', { name: 'Predict Risk' }));

    const summary = screen.getByText('A few clinical details need attention').closest('[role="alert"]');
    expect(summary).toBeInTheDocument();
    expect(summary).toHaveTextContent('5 fields');
    expect(screen.getByText('Age is required')).toBeInTheDocument();
    expect(screen.queryByText('Prediction complete!')).not.toBeInTheDocument();
    expect(document.querySelector('.Toastify__toast')).not.toBeInTheDocument();
  });
});

