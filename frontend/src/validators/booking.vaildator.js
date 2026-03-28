import * as Yup from 'yup';

export const BookingSchema = Yup.object().shape({
    firstName: Yup.string().required("First name is required"),
    lastName: Yup.string().required("Last name is required"),
    email: Yup.string().email("Invalid email format").required("Email is required"),
    phone: Yup.string()
        .matches(/^[6-9]\d{9}$/, "Invalid phone number")
        .required("Phone number is required"),
    startDateTime: Yup
        .date()
        .transform((value, originalValue) => (originalValue === "" ? null : value))
        .nullable()
        .required("Start date & time is required"),
    endDateTime: Yup
        .date()
        .transform((value, originalValue) => (originalValue === "" ? null : value))
        .nullable()
        .required("End date & time is required")
        .min(Yup.ref("startDateTime"), "End date & time cannot be before start date & time"),
});

export const BookmarkSchema = Yup.object().shape({
    userId: Yup.string()
        .required("User ID is required"),
    vehicleId: Yup.string()
        .required("Vehicle ID is required"),
});