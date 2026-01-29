import React from "react";
import PageShell from "../../components/layout/PageShell/PageShell";

export default function MyProfile() {
    return (
        <PageShell title="Hồ sơ cá nhân">
            <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>
                <h3>Cập nhật CV Profile</h3>
                <p>Form cập nhật thông tin sẽ hiển thị ở đây.</p>
            </div>
        </PageShell>
    );
}
