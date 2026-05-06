import SwiftUI

struct AgentCheckRowView: View {
    let check: AgentCheck

    private var statusColor: Color {
        switch check.status {
        case .passed:
            .green
        case .warning:
            .orange
        case .failed:
            .red
        }
    }

    private var statusIcon: String {
        switch check.status {
        case .passed:
            "checkmark.circle.fill"
        case .warning:
            "exclamationmark.triangle.fill"
        case .failed:
            "xmark.octagon.fill"
        }
    }

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: statusIcon)
                .foregroundStyle(statusColor)

            VStack(alignment: .leading, spacing: 5) {
                HStack(alignment: .firstTextBaseline) {
                    Text(check.title)
                        .font(.subheadline)
                        .fontWeight(.medium)

                    Spacer()

                    Text(check.status.rawValue.capitalized)
                        .font(.caption)
                        .foregroundStyle(statusColor)
                }

                Text(check.agentName)
                    .font(.caption)
                    .foregroundStyle(.secondary)

                Text(check.reason)
                    .font(.caption)
                    .foregroundStyle(.secondary)

                if let evidence = check.evidence {
                    Text("Evidence: \(evidence)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                }
            }
        }
        .padding(12)
        .background(Color(nsColor: .controlBackgroundColor))
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .textSelection(.enabled)
    }
}
