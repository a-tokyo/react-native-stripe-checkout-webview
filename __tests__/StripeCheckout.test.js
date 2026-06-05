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
    const wrapper = shallow(
      render({
        onSuccess: jest.fn(),
        onCancel: jest.fn(),
        onLoadingComplete: jest.fn(),
        renderOnComplete: jest.fn(),
      }),
    );
    expect(wrapper).toMatchSnapshot();
  });

  it('renders props correctly - webViewProps', () => {
    const wrapper = shallow(
      render({
        webViewProps: {
          originWhitelist: ['https://stripe.com'],
          source: {
            baseUrl: 'https://github.com/a-tokyo',
          },
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
          htmlContentHead: '<style>.test{}</style>',
        },
      }),
    );
    expect(wrapper).toMatchSnapshot();
  });
});

/**
 * https://github.com/a-tokyo/react-native-stripe-checkout-webview/issues/138
 * The success/cancel redirect must be intercepted and blocked so the WebView
 * never navigates to a (potentially 404) success/cancel URL.
 */
describe('<StripeCheckout /> redirect handling', () => {
  const SUCCESS_URL =
    'https://example.com/success?sc_checkout=success&sc_sid=cs_test_123';
  const CANCEL_URL = 'https://example.com/cancel?sc_checkout=cancel';
  const STRIPE_URL = 'https://checkout.stripe.com/pay/cs_test_123';

  it('blocks navigation and calls onSuccess with the checkout session id', () => {
    const onSuccess = jest.fn();
    const wrapper = shallow(render({ onSuccess }));
    const onShouldStartLoadWithRequest = wrapper
      .find('WebView')
      .prop('onShouldStartLoadWithRequest');

    const shouldLoad = onShouldStartLoadWithRequest({ url: SUCCESS_URL });

    expect(shouldLoad).toBe(false);
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ checkoutSessionId: 'cs_test_123' }),
    );
  });

  it('blocks navigation and calls onCancel on the cancel url', () => {
    const onCancel = jest.fn();
    const wrapper = shallow(render({ onCancel }));
    const onShouldStartLoadWithRequest = wrapper
      .find('WebView')
      .prop('onShouldStartLoadWithRequest');

    const shouldLoad = onShouldStartLoadWithRequest({ url: CANCEL_URL });

    expect(shouldLoad).toBe(false);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('allows navigation and fires no callback for non-completion urls', () => {
    const onSuccess = jest.fn();
    const onCancel = jest.fn();
    const wrapper = shallow(render({ onSuccess, onCancel }));
    const onShouldStartLoadWithRequest = wrapper
      .find('WebView')
      .prop('onShouldStartLoadWithRequest');

    const shouldLoad = onShouldStartLoadWithRequest({ url: STRIPE_URL });

    expect(shouldLoad).toBe(true);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('passes an undefined checkout session id when sc_sid is absent', () => {
    const onSuccess = jest.fn();
    const wrapper = shallow(render({ onSuccess }));
    const onShouldStartLoadWithRequest = wrapper
      .find('WebView')
      .prop('onShouldStartLoadWithRequest');

    onShouldStartLoadWithRequest({
      url: 'https://example.com/success?sc_checkout=success',
    });

    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ checkoutSessionId: undefined }),
    );
  });

  it('excludes a url fragment from the parsed checkout session id', () => {
    const onSuccess = jest.fn();
    const wrapper = shallow(render({ onSuccess }));
    const onShouldStartLoadWithRequest = wrapper
      .find('WebView')
      .prop('onShouldStartLoadWithRequest');

    onShouldStartLoadWithRequest({
      url: 'https://example.com/success?sc_checkout=success&sc_sid=cs_test_123#done',
    });

    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ checkoutSessionId: 'cs_test_123' }),
    );
  });

  it('fires the completion callback exactly once across both handlers', () => {
    const onSuccess = jest.fn();
    const wrapper = shallow(render({ onSuccess }));
    const webView = wrapper.find('WebView');
    const onShouldStartLoadWithRequest = webView.prop(
      'onShouldStartLoadWithRequest',
    );
    const onLoadStart = webView.prop('onLoadStart');

    onShouldStartLoadWithRequest({ url: SUCCESS_URL });
    /** the onLoadStart fallback should not re-trigger onSuccess */
    onLoadStart({ nativeEvent: { url: SUCCESS_URL } });

    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('delegates to a user provided onShouldStartLoadWithRequest', () => {
    const userHandler = jest.fn(() => false);
    const wrapper = shallow(
      render({ webViewProps: { onShouldStartLoadWithRequest: userHandler } }),
    );
    const onShouldStartLoadWithRequest = wrapper
      .find('WebView')
      .prop('onShouldStartLoadWithRequest');
    const request = { url: STRIPE_URL };

    const shouldLoad = onShouldStartLoadWithRequest(request);

    expect(userHandler).toHaveBeenCalledWith(request);
    expect(shouldLoad).toBe(false);
  });
});
