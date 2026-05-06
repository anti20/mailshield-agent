import SwiftUI

struct GmailMessageScanView: View {
    let selectedMessage: GmailMessageMetadata?
    let scanResult: GmailStaticScanResponse?
    let isLoading: Bool
    let errorMessage: String?
    let runScanAction: () -> Void

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
