import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import FormField from '../../FormField';
import { renderWithProviders } from '../../../../test/renderWithProviders';

describe('FormField', () => {
  it('renders label, hint, and input', () => {
    renderWithProviders(
      <FormField
        label="Age"
        hint="(years)"
        placeholder="Enter age"
        value=""
        onChange={() => {}}
      />
    );

    expect(screen.getByText('Age')).toBeInTheDocument();
    expect(screen.getByText('(years)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter age')).toBeInTheDocument();
  });

  it('renders validation error message when provided', () => {
    renderWithProviders(
      <FormField
        label="Age"
        error="Age is required"
        value=""
        onChange={() => {}}
      />
    );

    expect(screen.getByText('Age is required')).toBeInTheDocument();
  });
});
