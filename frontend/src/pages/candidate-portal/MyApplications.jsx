import React from "react";
import PageShell from "../../components/layout/PageShell/PageShell";

export default function MyApplications() {
    return (
        <PageShell title="Hồ sơ ứng tuyển của tôi">
            <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>
                <h3>Lịch sử ứng tuyển</h3>
                <p>Chưa có dữ liệu ứng tuyển.</p>
            </div>
        </PageShell>
    );
}
