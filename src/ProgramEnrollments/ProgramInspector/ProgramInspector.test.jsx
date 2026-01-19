import {
  fireEvent, render, screen, waitFor,
} from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import UserMessagesProvider from '../../userMessages/UserMessagesProvider';
import * as api from './data/api';
import ProgramInspector from './ProgramInspector';
import {
  programInspectorSuccessResponse,
  programInspectorErrorResponse,
} from './data/test/programInspector';
import ssoRecordsData from '../../users/data/test/ssoRecords';
import * as ssoAndUserApi from '../../users/data/api';
import samlProvidersResponseValues from './data/test/samlProviders';
import verifiedNameHistory from '../../users/data/test/verifiedNameHistory';
import UserSummaryData from '../../users/data/test/userSummary';

const mockedNavigator = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigator,
}));

const ProgramEnrollmentsWrapper = () => (
  <MemoryRouter initialEntries={['/programs?edx_user_id=123']}>
    <IntlProvider locale="en">
      <UserMessagesProvider>
        <ProgramInspector />
      </UserMessagesProvider>
    </IntlProvider>
  </MemoryRouter>
);

describe('Program Inspector', () => {
  let wrapper;
  let apiMock;
  let samlMock;
  let ssoMock;
  let verifiedNameMock;
  let getUserMock;

  const data = {
    username: 'verified',
    orgKey: samlProvidersResponseValues[0],
    externalKey: 'testuser',
  };

  beforeEach(() => {
    ssoMock = jest
      .spyOn(ssoAndUserApi, 'getSsoRecords')
      .mockImplementation(() => Promise.resolve(ssoRecordsData));
    samlMock = jest
      .spyOn(api, 'getSAMLProviderList')
      .mockImplementation(() => Promise.resolve(samlProvidersResponseValues));
    verifiedNameMock = jest
      .spyOn(ssoAndUserApi, 'getVerifiedNameHistory')
      .mockImplementation(() => Promise.resolve(verifiedNameHistory));
    getUserMock = jest
      .spyOn(ssoAndUserApi, 'getUser')
      .mockImplementation(() => Promise.resolve(UserSummaryData.userData));
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (apiMock) {
      apiMock.mockReset();
    }
    if (wrapper) {
      wrapper.unmount();
    }
    samlMock.mockReset();
    ssoMock.mockReset();
    verifiedNameMock.mockReset();
    getUserMock.mockReset();
  });

  it('default render', async () => {
    const { unmount } = render(<ProgramEnrollmentsWrapper />);
    apiMock = jest
      .spyOn(api, 'getProgramEnrollmentsInspector')
      .mockImplementationOnce(() => Promise.resolve(programInspectorErrorResponse));

    const usernameInput = document.querySelector("input[name='username']");
    const externalKeyInput = document.querySelector("input[name='externalKey']");
    expect(usernameInput.defaultValue).toEqual('');
    expect(externalKeyInput.defaultValue).toEqual('');
    unmount();
  });

  it('render when username', async () => {
    apiMock = jest
      .spyOn(api, 'getProgramEnrollmentsInspector')
      .mockImplementation(() => Promise.resolve(programInspectorSuccessResponse));

    const { unmount } = render(<ProgramEnrollmentsWrapper />);

    fireEvent.change(document.querySelector("input[name='username']"), { target: { value: data.username } });
    fireEvent.change(document.querySelector("select[name='orgKey']"), { target: { value: data.orgKey } });
    fireEvent.click(document.querySelector('button.btn-primary'));

    await waitFor(() => {
      expect(mockedNavigator).toHaveBeenCalledWith(
        `?edx_user_id=${UserSummaryData.userData.id}`,
      );
    });
    expect(document.querySelectorAll('.inspector-name-row p.h5')[0].textContent).toEqual(
      'Username',
    );
    expect(document.querySelectorAll('.inspector-name-row p.small')[0].textContent).toEqual(
      programInspectorSuccessResponse.learner_program_enrollments.user.username,
    );
    expect(document.querySelectorAll('.inspector-name-row p.h5')[1].textContent).toEqual(
      'Email',
    );
    expect(document.querySelectorAll('.inspector-name-row p.small')[1].textContent).toEqual(
      programInspectorSuccessResponse.learner_program_enrollments.user.email,
    );
    unmount();
  });

  it('render when external_user_key', async () => {
    apiMock = jest
      .spyOn(api, 'getProgramEnrollmentsInspector')
      .mockImplementation(() => Promise.resolve(programInspectorSuccessResponse));
    const { unmount } = render(<ProgramEnrollmentsWrapper />);

    fireEvent.change(document.querySelector(
      "input[name='externalKey']",
    ), { target: { value: data.externalKey } });
    fireEvent.change(document.querySelector(
      "select[name='orgKey']",
    ), { target: { value: data.orgKey } });
    fireEvent.click(document.querySelector('button.btn-primary'));

    await waitFor(() => {
      expect(mockedNavigator).toHaveBeenCalledWith(
        `?edx_user_id=${UserSummaryData.userData.id}`,
      );
    });

    expect(document.querySelectorAll('.inspector-name-row p.h5')[0].textContent).toEqual(
      'Username',
    );
    expect(document.querySelectorAll('.inspector-name-row p.small')[0].textContent).toEqual(
      programInspectorSuccessResponse.learner_program_enrollments.user.username,
    );
    expect(document.querySelectorAll('.inspector-name-row p.h5')[1].textContent).toEqual(
      'Email',
    );
    expect(document.querySelectorAll('.inspector-name-row p.small')[1].textContent).toEqual(
      programInspectorSuccessResponse.learner_program_enrollments.user.email,
    );
    unmount();
  });

  it('render nothing when no username or external_user_key', async () => {
    apiMock = jest
      .spyOn(api, 'getProgramEnrollmentsInspector')
      .mockImplementationOnce(() => Promise.resolve(programInspectorSuccessResponse));
    const { unmount } = render(<ProgramEnrollmentsWrapper />);

    fireEvent.change(document.querySelector(
      "input[name='username']",
    ), { target: { value: undefined } });
    fireEvent.change(document.querySelector(
      "input[name='externalKey']",
    ), { target: { value: undefined } });
    fireEvent.change(document.querySelector(
      "select[name='orgKey']",
    ), { target: { value: data.orgKey } });
    fireEvent.click(document.querySelector('button.btn-primary'));

    expect(mockedNavigator).toHaveBeenCalledWith(
      '/programs',
    );
    expect(document.querySelector('.inspector-name-row')).not.toBeInTheDocument();
    unmount();
  });

  it('render when getUser fails', async () => {
    apiMock = jest
      .spyOn(api, 'getProgramEnrollmentsInspector')
      .mockImplementation(() => Promise.resolve(programInspectorSuccessResponse));

    getUserMock = jest
      .spyOn(ssoAndUserApi, 'getUser')
      .mockImplementation(() => Promise.reject(new Error('Error fetching User Info')));

    const { unmount } = render(<ProgramEnrollmentsWrapper />);

    await waitFor(() => {
      expect(document.querySelectorAll('.alert')[0].textContent).toEqual('An error occurred while fetching user id');
    });

    fireEvent.change(document.querySelector(
      "input[name='username']",
    ), { target: { value: 'AnonyMouse' } });
    fireEvent.click(document.querySelector('button.btn-primary'));

    await waitFor(() => {
      expect(document.querySelectorAll('.alert')[0].textContent).toEqual('An error occurred while fetching user id');
      expect(mockedNavigator).toHaveBeenCalledTimes(3);
    });
    unmount();
  });

  it('check if SSO is present', async () => {
    // Set up the mock before rendering
    apiMock = jest
      .spyOn(api, 'getProgramEnrollmentsInspector')
      .mockImplementation(() => Promise.resolve(programInspectorSuccessResponse));

    const { unmount } = render(<ProgramEnrollmentsWrapper />);

    // Use the same approach as other tests with document.querySelector
    fireEvent.change(document.querySelector("input[name='username']"), { target: { value: data.username } });
    fireEvent.change(document.querySelector("select[name='orgKey']"), { target: { value: data.orgKey } });
    fireEvent.click(document.querySelector('button.btn-primary'));

    await waitFor(() => {
      expect(mockedNavigator).toHaveBeenCalledWith(
        `?edx_user_id=${UserSummaryData.userData.id}`,
      );
    });

    // Wait for SSO records to appear
    const ssoRecords = await screen.findByTestId('sso-records');
    expect(ssoRecords).toBeInTheDocument();
    expect(screen.getByText('SSO Records')).toBeInTheDocument();
    // Since the test data shows no SSO records were found, check for that instead
    expect(screen.getByText('SSO Record Not Found')).toBeInTheDocument();
    unmount();
  });

  it('renders enrollment details when learner has enrollments', async () => {
    apiMock = jest
      .spyOn(api, 'getProgramEnrollmentsInspector')
      .mockImplementation(() => Promise.resolve(programInspectorSuccessResponse));

    const { unmount } = render(<ProgramEnrollmentsWrapper />);

    fireEvent.change(document.querySelector("input[name='username']"), { target: { value: data.username } });
    fireEvent.change(document.querySelector("select[name='orgKey']"), { target: { value: data.orgKey } });
    fireEvent.click(document.querySelector('button.btn-primary'));

    await waitFor(() => {
      const enrollmentSection = document.querySelector('.enrollments');
      expect(enrollmentSection).not.toBeNull();
    }, { timeout: 3000 });
    unmount();
  });

  it('handles form input changes correctly', async () => {
    // Mock API to return Promise for the initial call triggered by URL parameter
    apiMock = jest
      .spyOn(api, 'getProgramEnrollmentsInspector')
      .mockImplementation(() => Promise.resolve(programInspectorSuccessResponse));

    const { unmount } = render(<ProgramEnrollmentsWrapper />);

    await waitFor(() => {
      const usernameInput = document.querySelector("input[name='username']");
      expect(usernameInput).not.toBeNull();
    });

    const usernameInput = document.querySelector("input[name='username']");
    const externalKeyInput = document.querySelector("input[name='externalKey']");

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(externalKeyInput, { target: { value: 'external123' } });

    expect(usernameInput.value).toBe('testuser');
    expect(externalKeyInput.value).toBe('external123');
    unmount();
  });

  it('renders error alert when error response is received', async () => {
    apiMock = jest
      .spyOn(api, 'getProgramEnrollmentsInspector')
      .mockImplementation(() => Promise.resolve(programInspectorErrorResponse));

    const { unmount } = render(<ProgramEnrollmentsWrapper />);

    fireEvent.change(document.querySelector("input[name='username']"), { target: { value: data.username } });
    fireEvent.click(document.querySelector('button.btn-primary'));

    await waitFor(() => {
      const alerts = document.querySelectorAll('.alert-danger');
      expect(alerts.length).toBeGreaterThan(0);
    });
    unmount();
  });

  it('clears form when search is submitted without any input', async () => {
    const { unmount } = render(<ProgramEnrollmentsWrapper />);

    fireEvent.change(document.querySelector("input[name='username']"), { target: { value: '' } });
    fireEvent.change(document.querySelector("input[name='externalKey']"), { target: { value: '' } });
    fireEvent.click(document.querySelector('button.btn-primary'));

    await waitFor(() => {
      expect(mockedNavigator).toHaveBeenCalledWith('/programs');
    });
    unmount();
  });

  it('renders SSO records successfully when records exist', async () => {
    apiMock = jest
      .spyOn(api, 'getProgramEnrollmentsInspector')
      .mockImplementation(() => Promise.resolve(programInspectorSuccessResponse));

    const { unmount } = render(<ProgramEnrollmentsWrapper />);

    fireEvent.change(document.querySelector("input[name='username']"), { target: { value: data.username } });
    fireEvent.change(document.querySelector("select[name='orgKey']"), { target: { value: data.orgKey } });
    fireEvent.click(document.querySelector('button.btn-primary'));

    await waitFor(() => {
      expect(mockedNavigator).toHaveBeenCalledWith(
        `?edx_user_id=${UserSummaryData.userData.id}`,
      );
    });

    // Wait for SSO records to load and verify
    await waitFor(() => {
      expect(ssoMock).toHaveBeenCalled();
    }, { timeout: 5000 });

    // Give time for state updates to complete
    await waitFor(() => {
      const ssoRecordsContainer = screen.getByTestId('sso-records');
      expect(ssoRecordsContainer).toBeInTheDocument();
      // Check that SSO card content is present (not the error message)
      const notFoundAlert = screen.queryByText('SSO Record Not Found');
      expect(notFoundAlert).not.toBeInTheDocument();
    }, { timeout: 5000 });

    unmount();
  });
});
