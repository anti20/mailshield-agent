import SwiftUI

struct StaticPreviewListView: View {
    let previewItems: [ScanPreviewItem]
    @Binding var selectedPreviewItemID: ScanPreviewItem.ID?
    let isLoading: Bool
    let errorMessage: String?
    let runAction: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Mock emails")
                    .font(.headline)

                Spacer()

                Button {
                    runAction()
                } label: {
                    Label("Run static preview", systemImage: "play.circle")
                }
                .disabled(isLoading)
            }

            if isLoading {
                ProgressView("Running checks...")
                    .controlSize(.small)
            }

            if let errorMessage {
                Text(errorMessage)
                    .font(.caption)
                    .foregroundStyle(.red)
            }

            if previewItems.isEmpty && !isLoading {
                Text("No preview results")
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(14)
                    .background(Color(nsColor: .controlBackgroundColor))
                    .clipShape(RoundedRectangle(cornerRadius: 8))
            } else {
                VStack(spacing: 8) {
                    ForEach(previewItems) { item in
                        StaticPreviewRowView(
                            previewItem: item,
                            isSelected: selectedPreviewItemID == item.id
                        ) {
                            selectedPreviewItemID = item.id
                        }
                    }
                }
            }
        }
    }
}

private struct StaticPreviewRowView: View {
    let previewItem: ScanPreviewItem
    let isSelected: Bool
    let selectAction: () -> Void

    var body: some View {
        Button {
            selectAction()
        } label: {
            VStack(alignment: .leading, spacing: 8) {
                Text(previewItem.email.subject)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .lineLimit(2)

                Text(previewItem.email.sender)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)

                HStack(spacing: 8) {
                    CheckCountBadge(count: previewItem.passedCheckCount, status: .passed)
                    CheckCountBadge(count: previewItem.warningCheckCount, status: .warning)
                    CheckCountBadge(count: previewItem.failedCheckCount, status: .failed)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(12)
            .background(isSelected ? Color.accentColor.opacity(0.16) : Color(nsColor: .controlBackgroundColor))
            .clipShape(RoundedRectangle(cornerRadius: 8))
        }
        .buttonStyle(.plain)
    }
}

private struct CheckCountBadge: View {
    let count: Int
    let status: AgentCheckStatus

    private var color: Color {
        switch status {
        case .passed:
            .green
        case .warning:
            .orange
        case .failed:
            .red
        }
    }

    var body: some View {
        Text("\(count) \(status.rawValue)")
            .font(.caption)
            .fontWeight(.medium)
            .foregroundStyle(color)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(color.opacity(0.12))
            .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}
