import {
  APP_INIT_ERROR, APP_READY, subscribe, initialize, mergeConfig, getConfig,
} from '@edx/frontend-platform';
import { getAuthenticatedUser } from '@edx/frontend-platform/auth';

import * as app from '.'; // eslint-disable-line no-unused-vars

var mockRender; // eslint-disable-line no-var
var mockCreateRoot; // eslint-disable-line no-var
jest.mock('react-dom/client', () => {
  mockRender = jest.fn();
  mockCreateRoot = jest.fn(() => ({
    render: mockRender,
  }));

  return ({
    createRoot: mockCreateRoot,
  });
});

jest.mock('@edx/frontend-platform/auth', () => ({
  getAuthenticatedUser: jest.fn(),
}));

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  StrictMode: 'React Strict Mode',
}));

jest.mock('@edx/frontend-platform', () => ({
  APP_READY: 'app-is-ready-key',
  APP_INIT_ERROR: 'app-init-error',
  subscribe: jest.fn(),
  initialize: jest.fn(),
  mergeConfig: jest.fn(),
  getConfig: jest.fn(() => ({
    FEATURE_CUSTOMER_SUPPORT_VIEW: 'false',
    FEATURE_CONFIGURATION_MANAGEMENT: false,
  })),
}));

jest.mock('@edx/frontend-enterprise-utils', () => ({
  hasFeatureFlagEnabled: jest.fn(() => false),
}));

jest.mock('./supportHeader', () => 'Header');
jest.mock('./SupportToolsTab/SupportToolsTab', () => 'Support Tools Tab');
jest.mock('./users/UserPage', () => 'User Page');
jest.mock('./FeatureBasedEnrollments/FeatureBasedEnrollmentIndexPage', () => 'FBE Index Page');
jest.mock('./ProgramEnrollments/ProgramEnrollmentsIndexPage', () => 'Program Enrollments Index Page');
jest.mock('./head/Head', () => 'Head');
jest.mock('./Configuration/Customers/CustomerDataTable/CustomersPage', () => 'Customers Page');
jest.mock('./Configuration/Provisioning/ProvisioningPage', () => 'Provisioning Page');
jest.mock('./Configuration/ConfigurationPage', () => 'Configuration Page');
jest.mock('./Configuration/Provisioning/ProvisioningForm', () => 'Provisioning Form Container');
jest.mock('./Configuration/Provisioning/SubsidyDetailView/SubsidyDetailViewContainer', () => 'Subsidy Detail View Container');
jest.mock('./Configuration/Provisioning/ErrorPage', () => 'Error Page Container');
jest.mock('./Configuration/Provisioning/SubsidyEditView/SubsidyEditViewContainer', () => 'Subsidy Edit View Container');
jest.mock('./Configuration/Customers/CustomerDetailView/CustomerViewContainer', () => 'Customer View Container');
jest.mock('./userMessages/UserMessagesProvider', () => 'User Messages Provider');

describe('app registry', () => {
  let getElement;

  beforeEach(() => {
    mockCreateRoot.mockClear();
    mockRender.mockClear();
    getConfig.mockClear();

    getElement = window.document.getElementById;
    window.document.getElementById = jest.fn(id => ({ id }));
  });

  afterAll(() => {
    window.document.getElementById = getElement;
  });

  test('subscribe: APP_READY renders app with administrator access', () => {
    getAuthenticatedUser.mockReturnValue({ administrator: true });
    getConfig.mockReturnValue({
      FEATURE_CUSTOMER_SUPPORT_VIEW: 'false',
      FEATURE_CONFIGURATION_MANAGEMENT: false,
    });
    const callArgs = subscribe.mock.calls[0];
    expect(callArgs[0]).toEqual(APP_READY);
    callArgs[1]();
    expect(mockRender).toHaveBeenCalled();
  });

  test('subscribe: APP_READY renders error page for non-administrator', () => {
    getAuthenticatedUser.mockReturnValue({ administrator: false });
    const callArgs = subscribe.mock.calls[0];
    expect(callArgs[0]).toEqual(APP_READY);
    callArgs[1]();
    expect(mockRender).toHaveBeenCalled();
  });

  test('subscribe: APP_READY renders app with customer support view enabled', () => {
    getAuthenticatedUser.mockReturnValue({ administrator: true });
    getConfig.mockReturnValue({
      FEATURE_CUSTOMER_SUPPORT_VIEW: 'true',
      FEATURE_CONFIGURATION_MANAGEMENT: false,
    });
    const callArgs = subscribe.mock.calls[0];
    expect(callArgs[0]).toEqual(APP_READY);
    callArgs[1]();
    expect(mockRender).toHaveBeenCalled();
    expect(getConfig).toHaveBeenCalled();
  });

  test('subscribe: APP_READY renders app with configuration management enabled', () => {
    getAuthenticatedUser.mockReturnValue({ administrator: true });
    getConfig.mockReturnValue({
      FEATURE_CUSTOMER_SUPPORT_VIEW: 'false',
      FEATURE_CONFIGURATION_MANAGEMENT: true,
    });
    const callArgs = subscribe.mock.calls[0];
    expect(callArgs[0]).toEqual(APP_READY);
    callArgs[1]();
    expect(mockRender).toHaveBeenCalled();
    expect(getConfig).toHaveBeenCalled();
  });

  test('subscribe: APP_READY renders app with all features enabled', () => {
    getAuthenticatedUser.mockReturnValue({ administrator: true });
    getConfig.mockReturnValue({
      FEATURE_CUSTOMER_SUPPORT_VIEW: 'true',
      FEATURE_CONFIGURATION_MANAGEMENT: true,
    });
    const callArgs = subscribe.mock.calls[0];
    expect(callArgs[0]).toEqual(APP_READY);
    callArgs[1]();
    expect(mockRender).toHaveBeenCalled();
    expect(getConfig).toHaveBeenCalled();
  });

  test('subscribe: APP_INIT_ERROR renders error page', () => {
    const callArgs = subscribe.mock.calls[1];
    expect(callArgs[0]).toEqual(APP_INIT_ERROR);
    const error = { message: 'test-error-message' };
    callArgs[1](error);
    expect(mockRender).toHaveBeenCalled();
  });

  test('initialize is called with correct config handler', () => {
    expect(initialize).toHaveBeenCalled();
    const initializeArgs = initialize.mock.calls[0][0];
    expect(initializeArgs).toHaveProperty('handlers');
    expect(initializeArgs).toHaveProperty('requireAuthenticatedUser', true);
    expect(initializeArgs).toHaveProperty('messages');

    if (initializeArgs.handlers && initializeArgs.handlers.config) {
      initializeArgs.handlers.config();
      expect(mergeConfig).toHaveBeenCalled();
    }
  });
});
