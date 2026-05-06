import SwiftUI

struct StaticPreviewDetailView: View {
    let previewItem: ScanPreviewItem?

    var body: some View {
        Group {
            if let previewItem {
                VStack(alignment: .leading, spacing: 16) {
                    emailSummary(previewItem.email)

                    VStack(alignment: .leading, spacing: 10) {
                        Text("Static Threat Agent checks")
                            .font(.headline)

                        ForEach(previewItem.checks) { check in
                            AgentCheckRowView(check: check)
                        }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .topLeading)
            } else {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Static Threat Agent checks")
                        .font(.headline)

                    Text("Run the static preview and select a mock email.")
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, minHeight: 140, alignment: .topLeading)
                .padding(14)
                .background(Color(nsColor: .controlBackgroundColor))
                .clipShape(RoundedRectangle(cornerRadius: 8))
            }
        }
    }

    private func emailSummary(_ email: NormalizedEmail) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(email.subject)
                .font(.title3)
                .fontWeight(.semibold)

            Text("From: \(email.sender)")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            if let replyTo = email.replyTo {
                Text("Reply-to: \(replyTo)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Text("Received: \(email.receivedAt, style: .date) \(email.receivedAt, style: .time)")
                .font(.caption)
                .foregroundStyle(.secondary)

            Text("\(email.links.count) links • \(email.attachments.count) attachments")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }
}
