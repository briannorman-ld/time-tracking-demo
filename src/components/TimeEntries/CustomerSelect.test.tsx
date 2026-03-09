import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CustomerSelect, CREATE_NEW_VALUE } from './CustomerSelect'

describe('CustomerSelect', () => {
  it('renders trigger with placeholder when value is empty', () => {
    render(
      <CustomerSelect value="" onChange={() => {}} options={[]} placeholder="Select customer" />
    )
    expect(screen.getByRole('button', { name: /select customer/i })).toBeInTheDocument()
    expect(screen.getByText('Select customer')).toBeInTheDocument()
  })

  it('renders selected customer name when value is set', () => {
    render(
      <CustomerSelect value="Acme Corp" onChange={() => {}} options={['Acme Corp']} />
    )
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
  })

  it('shows dropdown with options when trigger is clicked', async () => {
    const user = userEvent.setup()
    render(
      <CustomerSelect
        value=""
        onChange={() => {}}
        options={['Acme Corp', 'Beta Inc']}
      />
    )
    await user.click(screen.getByRole('button'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    expect(screen.getByText('Beta Inc')).toBeInTheDocument()
  })

  it('calls onChange when an option is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <CustomerSelect
        value=""
        onChange={onChange}
        options={['Acme Corp']}
      />
    )
    await user.click(screen.getByRole('button'))
    await user.click(screen.getByText('Acme Corp'))
    expect(onChange).toHaveBeenCalledWith('Acme Corp')
  })

  it('closes dropdown when an option is selected', async () => {
    const user = userEvent.setup()
    render(
      <CustomerSelect
        value=""
        onChange={() => {}}
        options={['Acme Corp']}
      />
    )
    await user.click(screen.getByRole('button'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    await user.click(screen.getByText('Acme Corp'))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('shows Create new customer option when onCreateCustomer is provided', async () => {
    const user = userEvent.setup()
    render(
      <CustomerSelect
        value=""
        onChange={() => {}}
        options={[]}
        onCreateCustomer={() => Promise.resolve('New Co')}
      />
    )
    await user.click(screen.getByRole('button'))
    expect(screen.getByText('+ Create new customer')).toBeInTheDocument()
  })

  it('calls onChange with CREATE_NEW_VALUE when Create new customer is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <CustomerSelect
        value=""
        onChange={onChange}
        options={[]}
        onCreateCustomer={() => Promise.resolve('New')}
      />
    )
    await user.click(screen.getByRole('button'))
    await user.click(screen.getByText('+ Create new customer'))
    expect(onChange).toHaveBeenCalledWith(CREATE_NEW_VALUE)
  })

  it('displays Create new customer label when value is CREATE_NEW_VALUE', () => {
    render(
      <CustomerSelect
        value={CREATE_NEW_VALUE}
        onChange={() => {}}
        options={[]}
      />
    )
    expect(screen.getByText('+ Create new customer')).toBeInTheDocument()
  })
})
