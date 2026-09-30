import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, User, MapPin } from "lucide-react";
import { detailsSchema, DetailsFormData } from "../../../../validation/detailsSchema";
import { INDIAN_STATES_AND_UTS } from "../../../../constants/indianStates";
import { useAppDispatch, useAppSelector } from "../../../../store";
import { setFullDetails } from "../../../../store/slices/checkoutSlice";
import { Input, Select } from "../../../common/Input";
import { Button } from "../../../common/Button";
import styles from "./DetailsStep.module.scss";

export interface DetailsStepProps {
  onBack: () => void;
  onNextStep: () => void;
}

export const DetailsStep: React.FC<DetailsStepProps> = ({ onBack, onNextStep }) => {
  const dispatch = useAppDispatch();
  const customer = useAppSelector(state => state.checkout.customer);
  const shippingAddress = useAppSelector(state => state.checkout.shippingAddress);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<DetailsFormData>({
    resolver: zodResolver(detailsSchema),
    mode: "onBlur",
    defaultValues: {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      line1: shippingAddress.line1,
      line2: shippingAddress.line2 ?? "",
      city: shippingAddress.city,
      state: shippingAddress.state || "Karnataka",
      pincode: shippingAddress.pincode,
    },
  });

  const onSubmit = (data: DetailsFormData) => {
    dispatch(
      setFullDetails({
        customer: {
          name: data.name,
          email: data.email,
          phone: data.phone,
        },
        shippingAddress: {
          line1: data.line1,
          line2: data.line2 || undefined,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
        },
      }),
    );
    onNextStep();
  };

  const stateOptions = [
    { value: "", label: "Select State or UT" },
    ...INDIAN_STATES_AND_UTS,
  ];

  return (
    <div className={styles.detailsStep}>
      <div className={styles.stepHeader}>
        <h2>Delivery &amp; Contact Details</h2>
        <p>Please enter your contact information and shipping destination.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className={styles.formCard}>
        {/* Contact Information */}
        <h3 className={styles.sectionTitle}>
          <User size={18} color="var(--color-accent)" aria-hidden="true" />
          <span>Contact Information</span>
        </h3>

        <div className={styles.gridTwoCols}>
          <Input
            label="Full Name"
            placeholder="e.g. Arjun Mehta"
            autoComplete="name"
            required
            error={errors.name?.message}
            {...register("name")}
          />

          <Input
            label="Email Address"
            type="email"
            inputMode="email"
            placeholder="e.g. arjun.mehta@example.com"
            autoComplete="email"
            helperText="Order confirmation and payment receipt will be sent here."
            required
            error={errors.email?.message}
            {...register("email")}
          />
        </div>

        <div>
          <Input
            label="Mobile Number (10 digits)"
            type="tel"
            inputMode="numeric"
            placeholder="9876543210"
            autoComplete="tel-national"
            helperText="Indian mobile number starting with 6-9 for delivery SMS updates."
            required
            error={errors.phone?.message}
            {...register("phone")}
          />
        </div>

        {/* Shipping Address */}
        <h3 className={styles.sectionTitle} style={{ marginTop: "var(--space-2)" }}>
          <MapPin size={18} color="var(--color-accent)" aria-hidden="true" />
          <span>Shipping Address</span>
        </h3>

        <Input
          label="Address Line 1"
          placeholder="Flat / House No., Apartment, Street address"
          autoComplete="address-line1"
          required
          error={errors.line1?.message}
          {...register("line1")}
        />

        <Input
          label="Address Line 2 (Optional)"
          placeholder="Landmark, Suite, Unit, etc."
          autoComplete="address-line2"
          error={errors.line2?.message}
          {...register("line2")}
        />

        <div className={styles.gridThreeCols}>
          <Input
            label="City"
            placeholder="e.g. Bengaluru"
            autoComplete="address-level2"
            required
            error={errors.city?.message}
            {...register("city")}
          />

          <Select
            label="State / Union Territory"
            options={stateOptions}
            autoComplete="address-level1"
            required
            error={errors.state?.message}
            {...register("state")}
          />

          <Input
            label="PIN Code"
            inputMode="numeric"
            maxLength={6}
            placeholder="560038"
            autoComplete="postal-code"
            required
            error={errors.pincode?.message}
            {...register("pincode")}
          />
        </div>

        {/* Navigation Action Bar */}
        <div className={styles.actionBar}>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onBack}
            leftIcon={<ArrowLeft size={16} />}
          >
            Back to Bag
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            disabled={!isValid && Object.keys(errors).length > 0}
            rightIcon={<ArrowRight size={18} />}
          >
            Continue to Payment
          </Button>
        </div>
      </form>
    </div>
  );
};
