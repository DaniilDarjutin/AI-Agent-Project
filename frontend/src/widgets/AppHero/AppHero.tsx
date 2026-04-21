import styles from "./AppHero.module.scss";
import { useNavigate, useLocation } from "react-router-dom";

function AppHero() {
  const location = useLocation();
  const navigate = useNavigate();
  const isChatPage = location.pathname === "/chat";
  const isTasksPage = location.pathname === "/tasks";

  return (
    <div className={styles.hero}>
      <img
        src="/stars.svg"
        alt="Stars"
        className={styles.icon}
        onClick={() => navigate("/chat")}
      />

      <h1 className={styles.title}>Your Task Tracker Assistant</h1>

      <div className={styles.switcher}>
        <button
          type="button"
          className={`${styles.switchButton} ${isChatPage ? styles.active : ""}`}
          onClick={() => navigate("/chat")}
        >
          Chat
        </button>

        <button
          type="button"
          className={`${styles.switchButton} ${isTasksPage ? styles.active : ""}`}
          onClick={() => navigate("/tasks")}
        >
          Tasks
        </button>
      </div>
    </div>
  );
}

export default AppHero;
