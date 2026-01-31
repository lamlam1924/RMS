import React, { useState, useEffect } from "react";
import PageShell from "../../layouts/PageShell";
import { systemConfigService } from "../../services/adminService";

export default function SystemConfiguration() {
  const [configs, setConfigs] = useState({
    // System Settings
    systemName: "",
    systemEmail: "",
    systemPhone: "",
    systemAddress: "",

    // Email Configuration
    smtpHost: "",
    smtpPort: "",
    smtpUsername: "",
    smtpPassword: "",
    smtpEnableSSL: true,

    // Application Settings
    maxFileUploadSize: "",
    allowedFileTypes: "",
    sessionTimeout: "",
    passwordMinLength: "",
    passwordRequireSpecialChar: true,

    // Recruitment Settings
    jobPostExpireDays: "",
    maxApplicationsPerJob: "",
    autoRejectAfterDays: "",

    // Notification Settings
    enableEmailNotifications: true,
    enableSMSNotifications: false,
    notifyOnNewApplication: true,
    notifyOnInterviewSchedule: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const data = await systemConfigService.getAll();

      // Convert array of configs to object
      const configObj = {};
      data.forEach((config) => {
        configObj[config.key] = config.value;
      });

      setConfigs((prev) => ({ ...prev, ...configObj }));
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Error loading configs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setSuccessMessage("");

      await systemConfigService.updateBulk(configs);

      setSuccessMessage("Configuration saved successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      alert("Error saving configuration: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfigs((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  if (loading) {
    return (
      <PageShell title="System Configuration">
        <div style={centerText}>Loading...</div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title="System Configuration">
        <div style={{ ...centerText, color: "red" }}>Error: {error}</div>
      </PageShell>
    );
  }

  return (
    <PageShell title="System Configuration">
      <form onSubmit={handleSubmit}>
        {successMessage && <div style={successAlert}>{successMessage}</div>}

        {/* System Settings */}
        <ConfigSection title="System Settings">
          <FormField label="System Name">
            <input
              type="text"
              name="systemName"
              value={configs.systemName}
              onChange={handleChange}
              style={input}
              placeholder="Recruitment Management System"
            />
          </FormField>

          <FormField label="System Email">
            <input
              type="email"
              name="systemEmail"
              value={configs.systemEmail}
              onChange={handleChange}
              style={input}
              placeholder="system@company.com"
            />
          </FormField>

          <div style={gridTwo}>
            <FormField label="System Phone">
              <input
                type="tel"
                name="systemPhone"
                value={configs.systemPhone}
                onChange={handleChange}
                style={input}
                placeholder="+84 123 456 789"
              />
            </FormField>

            <FormField label="System Address">
              <input
                type="text"
                name="systemAddress"
                value={configs.systemAddress}
                onChange={handleChange}
                style={input}
                placeholder="123 Street, City"
              />
            </FormField>
          </div>
        </ConfigSection>

        {/* Email Configuration */}
        <ConfigSection title="Email Configuration (SMTP)">
          <div style={gridTwo}>
            <FormField label="SMTP Host">
              <input
                type="text"
                name="smtpHost"
                value={configs.smtpHost}
                onChange={handleChange}
                style={input}
                placeholder="smtp.gmail.com"
              />
            </FormField>

            <FormField label="SMTP Port">
              <input
                type="number"
                name="smtpPort"
                value={configs.smtpPort}
                onChange={handleChange}
                style={input}
                placeholder="587"
              />
            </FormField>
          </div>

          <div style={gridTwo}>
            <FormField label="SMTP Username">
              <input
                type="text"
                name="smtpUsername"
                value={configs.smtpUsername}
                onChange={handleChange}
                style={input}
                placeholder="your-email@gmail.com"
              />
            </FormField>

            <FormField label="SMTP Password">
              <input
                type="password"
                name="smtpPassword"
                value={configs.smtpPassword}
                onChange={handleChange}
                style={input}
                placeholder="••••••••"
              />
            </FormField>
          </div>

          <FormField label="">
            <label style={checkboxLabel}>
              <input
                type="checkbox"
                name="smtpEnableSSL"
                checked={configs.smtpEnableSSL}
                onChange={handleChange}
                style={checkbox}
              />
              <span>Enable SSL/TLS</span>
            </label>
          </FormField>
        </ConfigSection>

        {/* Application Settings */}
        <ConfigSection title="Application Settings">
          <div style={gridTwo}>
            <FormField label="Max File Upload Size (MB)">
              <input
                type="number"
                name="maxFileUploadSize"
                value={configs.maxFileUploadSize}
                onChange={handleChange}
                style={input}
                placeholder="10"
              />
            </FormField>

            <FormField label="Allowed File Types">
              <input
                type="text"
                name="allowedFileTypes"
                value={configs.allowedFileTypes}
                onChange={handleChange}
                style={input}
                placeholder="pdf,doc,docx,jpg,png"
              />
            </FormField>
          </div>

          <div style={gridTwo}>
            <FormField label="Session Timeout (minutes)">
              <input
                type="number"
                name="sessionTimeout"
                value={configs.sessionTimeout}
                onChange={handleChange}
                style={input}
                placeholder="30"
              />
            </FormField>

            <FormField label="Password Min Length">
              <input
                type="number"
                name="passwordMinLength"
                value={configs.passwordMinLength}
                onChange={handleChange}
                style={input}
                placeholder="8"
              />
            </FormField>
          </div>

          <FormField label="">
            <label style={checkboxLabel}>
              <input
                type="checkbox"
                name="passwordRequireSpecialChar"
                checked={configs.passwordRequireSpecialChar}
                onChange={handleChange}
                style={checkbox}
              />
              <span>Password Require Special Character</span>
            </label>
          </FormField>
        </ConfigSection>

        {/* Recruitment Settings */}
        <ConfigSection title="Recruitment Settings">
          <div style={gridThree}>
            <FormField label="Job Post Expire (days)">
              <input
                type="number"
                name="jobPostExpireDays"
                value={configs.jobPostExpireDays}
                onChange={handleChange}
                style={input}
                placeholder="30"
              />
            </FormField>

            <FormField label="Max Applications Per Job">
              <input
                type="number"
                name="maxApplicationsPerJob"
                value={configs.maxApplicationsPerJob}
                onChange={handleChange}
                style={input}
                placeholder="100"
              />
            </FormField>

            <FormField label="Auto Reject After (days)">
              <input
                type="number"
                name="autoRejectAfterDays"
                value={configs.autoRejectAfterDays}
                onChange={handleChange}
                style={input}
                placeholder="90"
              />
            </FormField>
          </div>
        </ConfigSection>

        {/* Notification Settings */}
        <ConfigSection title="Notification Settings">
          <div style={checkboxGroup}>
            <label style={checkboxLabel}>
              <input
                type="checkbox"
                name="enableEmailNotifications"
                checked={configs.enableEmailNotifications}
                onChange={handleChange}
                style={checkbox}
              />
              <span>Enable Email Notifications</span>
            </label>

            <label style={checkboxLabel}>
              <input
                type="checkbox"
                name="enableSMSNotifications"
                checked={configs.enableSMSNotifications}
                onChange={handleChange}
                style={checkbox}
              />
              <span>Enable SMS Notifications</span>
            </label>

            <label style={checkboxLabel}>
              <input
                type="checkbox"
                name="notifyOnNewApplication"
                checked={configs.notifyOnNewApplication}
                onChange={handleChange}
                style={checkbox}
              />
              <span>Notify on New Application</span>
            </label>

            <label style={checkboxLabel}>
              <input
                type="checkbox"
                name="notifyOnInterviewSchedule"
                checked={configs.notifyOnInterviewSchedule}
                onChange={handleChange}
                style={checkbox}
              />
              <span>Notify on Interview Schedule</span>
            </label>
          </div>
        </ConfigSection>

        {/* Save Button */}
        <div style={formActions}>
          <button type="button" style={btnSecondary} onClick={loadConfigs}>
            Reset
          </button>
          <button type="submit" style={btnPrimary} disabled={saving}>
            {saving ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      </form>
    </PageShell>
  );
}

// Helper Components
function ConfigSection({ title, children }) {
  return (
    <div style={configSection}>
      <h3 style={sectionTitle}>{title}</h3>
      <div style={sectionContent}>{children}</div>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div style={formField}>
      {label && <label style={label_style}>{label}</label>}
      {children}
    </div>
  );
}

// Styles
const configSection = {
  backgroundColor: "white",
  borderRadius: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  padding: "24px",
  marginBottom: "24px",
};

const sectionTitle = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#333",
  marginBottom: "20px",
  paddingBottom: "12px",
  borderBottom: "2px solid #e9ecef",
};

const sectionContent = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

const formField = {
  display: "flex",
  flexDirection: "column",
};

const label_style = {
  fontSize: "14px",
  fontWeight: "500",
  color: "#333",
  marginBottom: "8px",
};

const input = {
  width: "100%",
  padding: "10px 15px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  fontSize: "14px",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const checkbox = {
  marginRight: "8px",
  cursor: "pointer",
  width: "18px",
  height: "18px",
};

const checkboxLabel = {
  display: "flex",
  alignItems: "center",
  fontSize: "14px",
  cursor: "pointer",
  padding: "8px 12px",
  backgroundColor: "#f8f9fa",
  borderRadius: "8px",
  transition: "background-color 0.2s",
};

const checkboxGroup = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap: "12px",
};

const gridTwo = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap: "16px",
};

const gridThree = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "16px",
};

const formActions = {
  display: "flex",
  gap: "12px",
  justifyContent: "flex-end",
  paddingTop: "20px",
  marginTop: "24px",
};

const btnPrimary = {
  padding: "12px 32px",
  borderRadius: 8,
  border: "none",
  backgroundColor: "#007bff",
  color: "white",
  fontWeight: "500",
  cursor: "pointer",
  fontSize: "14px",
  transition: "background-color 0.2s",
};

const btnSecondary = {
  padding: "12px 32px",
  borderRadius: 8,
  border: "1px solid #ddd",
  backgroundColor: "white",
  color: "#333",
  fontWeight: "500",
  cursor: "pointer",
  fontSize: "14px",
  transition: "all 0.2s",
};

const successAlert = {
  padding: "12px 20px",
  backgroundColor: "#d4edda",
  color: "#155724",
  borderRadius: "8px",
  marginBottom: "20px",
  fontSize: "14px",
  fontWeight: "500",
  border: "1px solid #c3e6cb",
};

const centerText = {
  textAlign: "center",
  padding: "40px",
  fontSize: "16px",
};
