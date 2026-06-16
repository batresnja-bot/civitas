import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ModerationResult } from './ModerationResult';

describe('ModerationResult', () => {
  it('shows an idle prompt when status is null', () => {
    render(<ModerationResult status={null} />);
    expect(screen.getByText(/AI screening/i)).toBeInTheDocument();
  });

  it('renders the approved state', () => {
    render(<ModerationResult status="approved" />);
    expect(screen.getByText(/Looks good/i)).toBeInTheDocument();
  });

  it('renders the borderline state with the server explanation', () => {
    render(<ModerationResult status="borderline" explanation="This needs a closer look." />);
    expect(screen.getByText(/Needs review/i)).toBeInTheDocument();
    expect(screen.getByText('This needs a closer look.')).toBeInTheDocument();
  });

  it('renders the rejected state', () => {
    render(<ModerationResult status="rejected" />);
    expect(screen.getByText(/Likely to be held/i)).toBeInTheDocument();
  });
});
