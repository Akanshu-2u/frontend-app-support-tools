import {
  fireEvent, render, screen, waitFor,
} from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { IntlProvider } from '@edx/frontend-platform/i18n';
import UserMessagesProvider from '../userMessages/UserMessagesProvider';
import UserPage from './UserPage';
import * as ssoAndUserApi from './data/api';
import UserSummaryData from './data/test/userSummary';
import verifiedNameHistoryData from './data/test/verifiedNameHistory';
import onboardingStatusData from './data/test/onboardingStatus';
import { entitlementsData } from './data/test/entitlements';
import enterpriseCustomerUsersData from './data/test/enterpriseCustomerUsers';
import { enrollmentsData } from './data/test/enrollments';
import ssoRecordsData from './data/test/ssoRecords';
import licensesData from './data/test/licenses';

const mockedNavigator = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigator,
}));

const UserPageWrapper = () => (
  <MemoryRouter>
    <IntlProvider locale="en">
      <UserMessagesProvider>
        <UserPage />
      </UserMessagesProvider>
    </IntlProvider>
  </MemoryRouter>
);

describe('User Page', () => {
  let mockedGetUserData;
  beforeEach(() => {
    mockedGetUserData = jest.spyOn(ssoAndUserApi, 'getAllUserData').mockImplementation(() => Promise.resolve({ user: UserSummaryData.userData, errors: [] }));
    jest.spyOn(ssoAndUserApi, 'getVerifiedNameHistory').mockImplementation(() => Promise.resolve(verifiedNameHistoryData));
    jest.spyOn(ssoAndUserApi, 'getEnrollments').mockImplementation(() => Promise.resolve(enrollmentsData));
    jest.spyOn(ssoAndUserApi, 'getOnboardingStatus').mockImplementation(() => Promise.resolve(onboardingStatusData));
    jest.spyOn(ssoAndUserApi, 'getSsoRecords').mockImplementation(() => Promise.resolve(ssoRecordsData));
    jest.spyOn(ssoAndUserApi, 'getLicense').mockImplementation(() => Promise.resolve(licensesData));
    jest.spyOn(ssoAndUserApi, 'getEntitlements').mockImplementation(() => Promise.resolve(entitlementsData));
    jest.spyOn(ssoAndUserApi, 'getEnterpriseCustomerUsers').mockImplementation(() => Promise.resolve(enterpriseCustomerUsersData));

    jest.clearAllMocks();
  });

  it('default render', async () => {
    render(<UserPageWrapper />);
    const userSearchInput = await screen.findByTestId('userSearchInput');
    fireEvent.change(userSearchInput, { target: { value: 'AnonyMouse' } });
    const btnToClick = await screen.findByTestId('userSearchSubmitButton');
    fireEvent.click(btnToClick);
    await waitFor(() => {
      expect(mockedNavigator).toHaveBeenCalledWith(
        `/learner_information/?lms_user_id=${UserSummaryData.userData.id}`,
      );
      expect(mockedGetUserData).toHaveBeenCalled();
    });
  });

  it('searches by email', async () => {
    render(<UserPageWrapper />);
    const userSearchInput = await screen.findByTestId('userSearchInput');
    fireEvent.change(userSearchInput, { target: { value: 'user@example.com' } });
    const btnToClick = await screen.findByTestId('userSearchSubmitButton');
    fireEvent.click(btnToClick);
    await waitFor(() => {
      expect(mockedGetUserData).toHaveBeenCalledWith('user@example.com');
    });
  });

  it('searches by LMS user ID', async () => {
    render(<UserPageWrapper />);
    const userSearchInput = await screen.findByTestId('userSearchInput');
    fireEvent.change(userSearchInput, { target: { value: '12345' } });
    const btnToClick = await screen.findByTestId('userSearchSubmitButton');
    fireEvent.click(btnToClick);
    await waitFor(() => {
      expect(mockedGetUserData).toHaveBeenCalledWith('12345');
    });
  });

  it('handles invalid user identifier', async () => {
    render(<UserPageWrapper />);
    const userSearchInput = await screen.findByTestId('userSearchInput');
    fireEvent.change(userSearchInput, { target: { value: 'invalid user!' } });
    const btnToClick = await screen.findByTestId('userSearchSubmitButton');
    fireEvent.click(btnToClick);
    await waitFor(() => {
      expect(screen.getByText(/username, email or lms user id is invalid/i)).toBeInTheDocument();
    });
  });

  it('handles empty search', async () => {
    render(<UserPageWrapper />);
    const userSearchInput = await screen.findByTestId('userSearchInput');
    fireEvent.change(userSearchInput, { target: { value: '' } });
    const btnToClick = await screen.findByTestId('userSearchSubmitButton');
    fireEvent.click(btnToClick);
    await waitFor(() => {
      expect(mockedNavigator).toHaveBeenCalledWith('/learner_information', { replace: true });
    });
  });

  it('handles API errors', async () => {
    mockedGetUserData.mockImplementationOnce(() => Promise.resolve({
      errors: [{ text: 'User not found', type: 'error', code: 'user_not_found' }],
      retirementStatus: null,
    }));

    render(<UserPageWrapper />);
    const userSearchInput = await screen.findByTestId('userSearchInput');
    fireEvent.change(userSearchInput, { target: { value: 'nonexistent' } });
    const btnToClick = await screen.findByTestId('userSearchSubmitButton');
    fireEvent.click(btnToClick);

    await waitFor(() => {
      expect(mockedNavigator).toHaveBeenCalledWith('/learner_information', { replace: true });
    });
  });

  it('displays cancel retirement when applicable', async () => {
    mockedGetUserData.mockImplementationOnce(() => Promise.resolve({
      errors: [{ text: 'User is retired' }],
      retirementStatus: {
        canCancelRetirement: true,
        retirementId: 123,
      },
    }));

    render(<UserPageWrapper />);
    const userSearchInput = await screen.findByTestId('userSearchInput');
    fireEvent.change(userSearchInput, { target: { value: 'retired_user' } });
    const btnToClick = await screen.findByTestId('userSearchSubmitButton');
    fireEvent.click(btnToClick);

    await waitFor(() => {
      expect(screen.getByText('Cancel Retirement')).toBeInTheDocument();
    });
  });

  it('initializes with username from URL parameter', async () => {
    render(
      <IntlProvider locale="en">
        <MemoryRouter initialEntries={['/users?username=urluser']}>
          <UserMessagesProvider>
            <UserPage />
          </UserMessagesProvider>
        </MemoryRouter>
      </IntlProvider>,
    );

    await waitFor(() => {
      expect(mockedGetUserData).toHaveBeenCalledWith('urluser');
    });
  });

  it('initializes with email from URL parameter', async () => {
    render(
      <IntlProvider locale="en">
        <MemoryRouter initialEntries={['/users?email=test@example.com']}>
          <UserMessagesProvider>
            <UserPage />
          </UserMessagesProvider>
        </MemoryRouter>
      </IntlProvider>,
    );

    await waitFor(() => {
      expect(mockedGetUserData).toHaveBeenCalledWith('test@example.com');
    });
  });

  it('initializes with lms_user_id from URL parameter', async () => {
    render(
      <IntlProvider locale="en">
        <MemoryRouter initialEntries={['/users?lms_user_id=54321']}>
          <UserMessagesProvider>
            <UserPage />
          </UserMessagesProvider>
        </MemoryRouter>
      </IntlProvider>,
    );

    await waitFor(() => {
      expect(mockedGetUserData).toHaveBeenCalledWith('54321');
    });
  });

  it('displays learner information when user data is loaded', async () => {
    mockedGetUserData.mockImplementationOnce(() => Promise.resolve({
      user: UserSummaryData.userData,
      enrollments: enrollmentsData,
      errors: [],
    }));

    render(<UserPageWrapper />);
    const userSearchInput = await screen.findByTestId('userSearchInput');
    fireEvent.change(userSearchInput, { target: { value: 'testuser' } });
    const btnToClick = await screen.findByTestId('userSearchSubmitButton');
    fireEvent.click(btnToClick);

    await waitFor(() => {
      expect(screen.getByText('Account Information')).toBeInTheDocument();
    });
  });

  it('does not display learner information when username is missing', async () => {
    mockedGetUserData.mockImplementationOnce(() => Promise.resolve({
      user: { id: 123, email: 'test@example.com' }, // No username
      enrollments: [],
      errors: [],
    }));

    render(<UserPageWrapper />);
    const userSearchInput = await screen.findByTestId('userSearchInput');
    fireEvent.change(userSearchInput, { target: { value: 'testuser' } });
    const btnToClick = await screen.findByTestId('userSearchSubmitButton');
    fireEvent.click(btnToClick);

    await waitFor(() => {
      expect(screen.queryByText('Account Information')).not.toBeInTheDocument();
    });
  });
});
