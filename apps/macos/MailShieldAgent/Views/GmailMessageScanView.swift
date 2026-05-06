import SwiftUI

struct GmailMessageScanView: View {
    let selectedMessage: GmailMessageMetadata?
    let scanResult: GmailStaticScanResponse?
    let isLoading: Bool
    let errorMessage: String?
    let agentScanResult: GmailAgentScanResponse?
    let isLoadingAgentScan: Bool
    let agentScanErrorMessage: String?
    let runScanAction: () -> Void
    let runAgentScanAction: () -> Void

    var body: some View {
        Group {
            if let selectedMessage {
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        header(for: selectedMessage)

                        HStack(spacing: 8) {
                            scanCountBadge("passed", count: scanResult?.passedCheckCount ?? 0, color: .green)
                            scanCountBadge("warning", count: scanResult?.warningCheckCount ?? 0, color: .orange)
                            scanCountBadge("failed", count: scanResult?.failedCheckCount ?? 0, color: .red)
                        }

                        if let errorMessage {
                            Text(errorMessage)
                                .font(.caption)
                                .foregroundStyle(.red)
                        }

                        if isLoading {
                            ProgressView("Running static scan...")
                                .controlSize(.small)
                        }

                        Button {
                            runScanAction()
                        } label: {
                            Label("Run static scan on selected message", systemImage: "play.circle")
                        }
                        .disabled(isLoading)

                        Divider()

                        agentScanSection

                        VStack(alignment: .leading, spacing: 10) {
                            Text("Static Threat Agent checks")
                                .font(.headline)

                            if let scanResult {
                                ForEach(scanResult.checks) { check in
                                    AgentCheckRowView(check: check)
                                }
                            } else {
                                Text("Run static scan to view checks for this Gmail message.")
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
            } else {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Gmail static scan")
                        .font(.headline)

                    Text("Load recent Gmail messages and select one to run static scan.")
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                .padding(14)
                .background(Color(nsColor: .controlBackgroundColor))
                .clipShape(RoundedRectangle(cornerRadius: 8))
            }
        }
    }

    private var agentScanSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("AI agent scan")
                    .font(.headline)

                Spacer()

                Button {
                    runAgentScanAction()
                } label: {
                    Label("Run AI agent scan", systemImage: "sparkles")
                }
                .disabled(isLoadingAgentScan)
            }

            if let agentScanErrorMessage {
                Text(agentScanErrorMessage)
                    .font(.caption)
                    .foregroundStyle(.red)
            }

            if isLoadingAgentScan {
                ProgressView("Running AI agent chain...")
                    .controlSize(.small)
            }

            if let agentScanResult {
                VStack(alignment: .leading, spacing: 12) {
                    RiskBadgeView(
                        riskLevel: agentScanResult.finalRiskLevel,
                        riskScore: agentScanResult.finalRiskScore
                    )

                    Text(agentScanResult.finalExplanation)
                        .font(.subheadline)

                    VStack(alignment: .leading, spacing: 8) {
                        Text("Agent chain")
                            .font(.subheadline)
                            .fontWeight(.semibold)

                        ForEach(agentScanResult.agentSteps) { step in
                            AgentStepRowView(step: step)
                        }
                    }

                    if !agentScanResult.limitations.isEmpty {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Limitations")
                                .font(.subheadline)
                                .fontWeight(.semibold)

                            ForEach(agentScanResult.limitations, id: \.self) { limitation in
                                Text(limitation)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                }
            } else if !isLoadingAgentScan {
                Text("Run AI agent scan to view the OpenAI-powered chain result.")
                    .foregroundStyle(.secondary)
            }
        }
    }

    private func header(for message: GmailMessageMetadata) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(message.subject)
                .font(.title3)
                .fontWeight(.semibold)

            Text("From: \(message.sender)")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            Text("Received: \(message.receivedAt, style: .date) \(message.receivedAt, style: .time)")
                .font(.caption)
                .foregroundStyle(.secondary)

            if message.hasAttachments {
                Text("Attachment metadata present")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }

    private func scanCountBadge(_ label: String, count: Int, color: Color) -> some View {
        Text("\(count) \(label)")
            .font(.caption)
            .fontWeight(.medium)
            .foregroundStyle(color)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(color.opacity(0.12))
            .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}

private struct AgentStepRowView: View {
    let step: AgentStep

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(step.agentName)
                    .font(.caption)
                    .fontWeight(.semibold)

                Spacer()

                Text(step.status.rawValue.capitalized)
                    .font(.caption2)
                    .foregroundStyle(step.status == .completed ? .green : .orange)
            }

            Text(step.summary)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding(10)
        .background(Color(nsColor: .controlBackgroundColor))
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}
