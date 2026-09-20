import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import ModalSection from '../ModalSection';
import { renderWithProviders } from '../../../test/renderWithProviders';

describe('ModalSection', () => {
  it('renders its selected section content without nested accordion controls', () => {
    renderWithProviders(
      <ModalSection icon={null} title="Clinical Parameters">
        <p>Age 63</p>
      </ModalSection>
    );

    expect(screen.getByRole('heading', { name: 'Clinical Parameters' })).toBeInTheDocument();
    expect(screen.getByText('Age 63')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clinical Parameters' })).not.toBeInTheDocument();
  });
});

