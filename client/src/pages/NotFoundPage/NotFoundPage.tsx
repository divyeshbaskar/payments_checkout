import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../components/common/Button";
import styles from "./NotFoundPage.module.scss";

export const NotFoundPage: React.FC = () => {
  return (
    <div className={styles.notFoundPage}>
      <div className={styles.errorCode}>404</div>
      <h1>Page Not Found</h1>
      <p>
        The page or checkout step you are looking for does not exist or has been
        relocated.
      </p>
      <div style={{ marginTop: 16 }}>
        <Link to="/">
          <Button variant="primary" leftIcon={<ArrowLeft size={16} />}>
            Back to Meridian Checkout
          </Button>
        </Link>
      </div>
    </div>
  );
};
