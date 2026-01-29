import React from "react";
import PageShell from "../../components/layout/PageShell/PageShell";

export default function JobBoard() {
    return (
        <PageShell title="Cơ hội việc làm">
            <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>
                <h3>Danh sách vị trí đang tuyển dụng</h3>
                <p>Đang kết nối API...</p>
            </div>
        </PageShell>
    );
}
