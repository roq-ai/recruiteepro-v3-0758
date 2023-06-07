import AppLayout from 'layout/app-layout';
import React, { useState } from 'react';
import {
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  Box,
  Spinner,
  FormErrorMessage,
  Switch,
  NumberInputStepper,
  NumberDecrementStepper,
  NumberInputField,
  NumberIncrementStepper,
  NumberInput,
} from '@chakra-ui/react';
import * as yup from 'yup';
import DatePicker from 'react-datepicker';
import { useFormik, FormikHelpers } from 'formik';
import { getOnboardingById, updateOnboardingById } from 'apiSdk/onboardings';
import { Error } from 'components/error';
import { onboardingValidationSchema } from 'validationSchema/onboardings';
import { OnboardingInterface } from 'interfaces/onboarding';
import useSWR from 'swr';
import { useRouter } from 'next/router';
import { AsyncSelect } from 'components/async-select';
import { ArrayFormField } from 'components/array-form-field';
import { AccessOperationEnum, AccessServiceEnum, withAuthorization } from '@roq/nextjs';
import { JobApplicationInterface } from 'interfaces/job-application';
import { UserInterface } from 'interfaces/user';
import { getJobApplications } from 'apiSdk/job-applications';
import { getUsers } from 'apiSdk/users';

function OnboardingEditPage() {
  const router = useRouter();
  const id = router.query.id as string;
  const { data, error, isLoading, mutate } = useSWR<OnboardingInterface>(
    () => (id ? `/onboardings/${id}` : null),
    () => getOnboardingById(id),
  );
  const [formError, setFormError] = useState(null);

  const handleSubmit = async (values: OnboardingInterface, { resetForm }: FormikHelpers<any>) => {
    setFormError(null);
    try {
      const updated = await updateOnboardingById(id, values);
      mutate(updated);
      resetForm();
    } catch (error) {
      setFormError(error);
    }
  };

  const formik = useFormik<OnboardingInterface>({
    initialValues: data,
    validationSchema: onboardingValidationSchema,
    onSubmit: handleSubmit,
    enableReinitialize: true,
    validateOnChange: false,
    validateOnBlur: false,
  });

  return (
    <AppLayout>
      <Text as="h1" fontSize="2xl" fontWeight="bold">
        Edit Onboarding
      </Text>
      <Box bg="white" p={4} rounded="md" shadow="md">
        {error && <Error error={error} />}
        {formError && <Error error={formError} />}
        {isLoading || (!formik.values && !error) ? (
          <Spinner />
        ) : (
          <form onSubmit={formik.handleSubmit}>
            <FormControl id="start_date" mb="4">
              <FormLabel>Start Date</FormLabel>
              <DatePicker
                dateFormat={'dd/MM/yyyy'}
                selected={formik.values?.start_date}
                onChange={(value: Date) => formik.setFieldValue('start_date', value)}
              />
            </FormControl>
            <FormControl id="end_date" mb="4">
              <FormLabel>End Date</FormLabel>
              <DatePicker
                dateFormat={'dd/MM/yyyy'}
                selected={formik.values?.end_date}
                onChange={(value: Date) => formik.setFieldValue('end_date', value)}
              />
            </FormControl>
            <AsyncSelect<JobApplicationInterface>
              formik={formik}
              name={'job_application_id'}
              label={'Select Job Application'}
              placeholder={'Select Job Application'}
              fetcher={getJobApplications}
              renderOption={(record) => (
                <option key={record.id} value={record.id}>
                  {record?.job_opening_id}
                </option>
              )}
            />
            <AsyncSelect<UserInterface>
              formik={formik}
              name={'admin_id'}
              label={'Select User'}
              placeholder={'Select User'}
              fetcher={getUsers}
              renderOption={(record) => (
                <option key={record.id} value={record.id}>
                  {record?.email}
                </option>
              )}
            />
            <Button isDisabled={formik?.isSubmitting} colorScheme="blue" type="submit" mr="4">
              Submit
            </Button>
          </form>
        )}
      </Box>
    </AppLayout>
  );
}

export default withAuthorization({
  service: AccessServiceEnum.PROJECT,
  entity: 'onboarding',
  operation: AccessOperationEnum.UPDATE,
})(OnboardingEditPage);
