import torch
import torch.nn as nn

class SimpleLamenessClassifier(nn.Module):
    """
    Simple MLP taking feature vector of length 9 (as used in inference.py).
    Modify input size if you add/remove features.
    """
    def __init__(self, input_dim=9, hidden_dim=64):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(hidden_dim, hidden_dim//2),
            nn.ReLU(),
            nn.Linear(hidden_dim//2, 1)  # single logit for sigmoid binary classification
        )
    def forward(self, x):
        return self.net(x).squeeze(1)  # returns (batch,) logits
