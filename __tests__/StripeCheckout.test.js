import React from 'react';
import { shallow } from 'enzyme';
import StripeCheckout from '../src/StripeCheckout';

const render = (overrideProps) => (
  <StripeCheckout
    stripePublicKey={'sp_test_STRIPE_PUBLIC_KEY'}
    checkoutSessionInput={{
      sessionId: 'CHECKOUT_SESSION_ID',
    }}
    {...overrideProps}
  />
);

describe('<StripeCheckout />', () => {
  it('renders props correctly', () => {
    const wrapper = shallow(render());
    expect(wrapper).toMatchSnapshot();
  });

  it('renders props correctly - extra props', () => {
    const wrapper = shallow(render({
      onSuccess: jest.fn(),
      onCancel: jest.fn(),
      onLoadingComplete: jest.fn(),
      renderOnComplete: jest.fn(),
    }));
    expect(wrapper).toMatchSnapshot();
  });

  it('renders props correctly - webViewProps', () => {
    const wrapper = shallow(
      render({
        webViewProps: {
          originWhitelist: ['https://stripe.com'],
        },
      }),
    );
    expect(wrapper).toMatchSnapshot();
  });

  it('renders props correctly - options', () => {
    const wrapper = shallow(
      render({
        options: {
          htmlContentLoading: '<p>htmlContentLoading test</p>',
          htmlContentError: '<p>htmlContentError test</p>',
        },
      }),
    );
    expect(wrapper).toMatchSnapshot();
  });
});
