/* @flow */
import React, { useRef, useState } from 'react';
import { Text } from 'react-native';
import { WebView } from 'react-native-webview';

import stripeCheckoutRedirectHTML from './stripeCheckoutRedirectHTML';

type Props = {
  /** Stripe public key */
  stripePublicKey: string,
  /** Stripe Checkout Session input */
  checkoutSessionInput: {
    /**
     * Server-side Checkout Session flow.
     * Only `sessionId` is forwarded to `stripe.redirectToCheckout`.
     * Everything else (`successUrl`, `cancelUrl`, `locale`, ...) must be
     * configured when creating the Checkout Session server-side.
     * `locale`, if provided, is additionally used as a client-side hint via
     * the Stripe.js constructor.
     */
    sessionId: string,
    locale?: string,
  }
| {
    clientReferenceId: string,
    successUrl: string,
    cancelUrl: string,
    items?: Array<{ plan: string, quantity: string }>,
    lineItems?: Array<{ price: number, quantity: number }>,
    mode?: 'payment' | 'subscription',
    submitType?: string,
    // common
    customerEmail?: string,
    billingAddressCollection?: 'required' | 'auto',
    shippingAddressCollection?: {
      allowedCountries: Array<string>,
    },
    locale?: string,
  },
  /** Called when the Stripe checkout session completes with status 'success' */
  onSuccess: ({ [key: string]: any, checkoutSessionId?: string }) => any,
  /** Called when the Stripe checkout session completes with status 'cancel' */
  onCancel: ({ [key: string]: any }) => any,
  /** Called when the Stripe checkout session webpage loads successfully */
  onLoadingComplete?: (syntheticEvent: SyntheticEvent) => any,
  /** Extra options */
  options?: {
    /** The loading item is set on the element with id='sc-loading' */
    htmlContentLoading?: string,
    /** The error is set on the element with id='sc-error-message' */
    htmlContentError?: string,
  },
  /** Props passed to the WebView */
  webViewProps?: Object,
  /** Renders the component shown when checkout session is completed */
  renderOnComplete?: () => React$Node,
};

/**
 * StripeCheckoutWebView
 *
 * Handles a full Stripe Checkout journey on react native via webview
 *
 * Important Notes about URLs:
 * - successUrl must have the query string params `?sc_checkout=success&sc_sid={CHECKOUT_SESSION_ID}`
 *   - sc_sid is optional - must be the last param - when passed results in sessionId being passed to the onSuccess function
 * - cancelUrl must have the query string params `?sc_checkout=cancel`
 */
const StripeCheckoutWebView = (props: Props) => {
  const {
    stripePublicKey,
    checkoutSessionInput,
    onSuccess,
    onCancel,
    onLoadingComplete,
    options,
    webViewProps = {},
    renderOnComplete,
  } = props;
  /** Holds the complete URL if exists */
  const [completed, setCompleted] = useState(null);
  /** Holds whether Stripe Checkout has loaded yet */
  const [hasLoaded, setHasLoaded] = useState(false);
  /**
   * Tracks whether the checkout completion has already been handled so that
   * `onSuccess`/`onCancel` fire exactly once even though completion can be
   * detected from both `onShouldStartLoadWithRequest` and `onLoadStart`.
   */
  const hasCompletedRef = useRef(false);

  /**
   * Inspects a URL the WebView is about to load and, if it is the Stripe
   * success/cancel redirect, completes the checkout session.
   *
   * @returns {boolean} `true` if the URL was a completion URL (and was handled),
   *   in which case the caller should prevent the WebView from navigating to it
   *   - this avoids landing on a 404 when the success/cancel URL is a placeholder
   *   (see https://github.com/a-tokyo/react-native-stripe-checkout-webview/issues/138).
   */
  const _handleCompletionUrl = (currentUrl: string): boolean => {
    if (!currentUrl) {
      return false;
    }
    /** Check and handle checkout state: success */
    if (currentUrl.includes('sc_checkout=success')) {
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        /** Extract the optional `sc_sid` checkout session id - undefined if absent.
         * Stop at a query separator (`&`), path separator (`/`) or fragment (`#`). */
        const sessionIdMatch = currentUrl.match(/sc_sid=([^&/#]+)/);
        const checkoutSessionId = sessionIdMatch ? sessionIdMatch[1] : undefined;
        setCompleted(true);
        if (onSuccess) {
          onSuccess({ ...props, checkoutSessionId });
        }
      }
      return true;
    }
    /** Check and handle checkout state: cancel */
    if (currentUrl.includes('sc_checkout=cancel')) {
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        setCompleted(true);
        if (onCancel) {
          onCancel(props);
        }
      }
      return true;
    }
    return false;
  };

  /**
   * Called before the WebView loads a URL.
   *
   * Returning `false` prevents the WebView from navigating to the success/cancel
   * URL, so a placeholder/non-existent redirect URL never renders a 404 page.
   */
  const _onShouldStartLoadWithRequest = (request: { url: string }): boolean => {
    if (_handleCompletionUrl(request && request.url)) {
      /** block navigation to the success/cancel URL */
      return false;
    }
    /** respect a user provided onShouldStartLoadWithRequest */
    if (webViewProps && webViewProps.onShouldStartLoadWithRequest) {
      return webViewProps.onShouldStartLoadWithRequest(request);
    }
    return true;
  };

  /**
   * Called every time the URL starts to load in the WebView.
   *
   * Handles completing the checkout session - acts as a fallback for platforms
   * where `onShouldStartLoadWithRequest` is not invoked for the redirect.
   */
  const _onLoadStart = (syntheticEvent: SyntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    const { url: currentUrl } = nativeEvent;
    _handleCompletionUrl(currentUrl);
    /** call webViewProps.onLoadStart */
    if (webViewProps && webViewProps.onLoadStart) {
      webViewProps.onLoadStart(syntheticEvent);
    }
  };

  /**
   * Called upon URL load complete
   */
  const _onLoadEnd = (syntheticEvent: SyntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    /** set isLoading to false once the stripe checkout page loads */
    if (!hasLoaded && nativeEvent.url.startsWith('https://checkout.stripe.com') && onLoadingComplete) {
      setHasLoaded(true);
      onLoadingComplete(syntheticEvent);
    }
    /** call webViewProps.onLoadStart */
    if (webViewProps && webViewProps.onLoadEnd) {
      webViewProps.onLoadEnd(syntheticEvent);
    }
  };

  /** If the checkout session is complete -- render the complete content */
  if (completed) {
    return renderOnComplete ? (
      renderOnComplete({ url: completed, ...props })
    ) : (
      <Text>Stripe Checkout session complete.</Text>
    );
  }

  /** Render the WebView holding the Stripe checkout flow */
  return (
    <WebView
      /** pass baseUrl to avoid  `IntegrationError: Live Stripe.js integrations must use HTTPS.` error https://github.com/react-native-community/react-native-webview/issues/1317 */
      baseUrl=""
      originWhitelist={['*']}
      {...webViewProps}
      source={{
        html: stripeCheckoutRedirectHTML(
          stripePublicKey,
          checkoutSessionInput,
          options,
        ),
        // Ensure an https baseUrl is used to avoid infinite loading on production due to https://github.com/A-Tokyo/react-native-stripe-checkout-webview/issues/10
        baseUrl: 'https://stripe.com',
        ...webViewProps?.source,
      }}
      onShouldStartLoadWithRequest={_onShouldStartLoadWithRequest}
      onLoadStart={_onLoadStart}
      onLoadEnd={_onLoadEnd}
    />
  );
};

export default StripeCheckoutWebView;
