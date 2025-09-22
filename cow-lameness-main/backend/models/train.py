"""
Skeleton training script — you'll need labeled data. This script assumes you have features
extracted (same features used by inference: 9-element vector) in numpy arrays X.npy and y.npy.

Usage: python train.py --data_dir data/
"""
import argparse
import numpy as np
import torch
from torch.utils.data import TensorDataset, DataLoader
from model import SimpleLamenessClassifier
import torch.optim as optim
import torch.nn.functional as F
import os

def train(data_dir, epochs=30, batch_size=32, lr=1e-3, save_path="models/lame_classifier.pth"):
    X = np.load(os.path.join(data_dir, "X.npy"))  # shape (N, 9)
    y = np.load(os.path.join(data_dir, "y.npy"))  # shape (N,) 0/1
    X = torch.from_numpy(X).float()
    y = torch.from_numpy(y).float()
    ds = TensorDataset(X, y)
    dl = DataLoader(ds, batch_size=batch_size, shuffle=True)
    model = SimpleLamenessClassifier(input_dim=X.shape[1])
    opt = optim.Adam(model.parameters(), lr=lr)
    for epoch in range(epochs):
        model.train()
        total_loss = 0.0
        for xb, yb in dl:
            opt.zero_grad()
            logits = model(xb)
            loss = F.binary_cross_entropy_with_logits(logits, yb)
            loss.backward()
            opt.step()
            total_loss += loss.item() * xb.size(0)
        print(f"Epoch {epoch+1}/{epochs} loss: {total_loss / len(ds):.4f}")
    os.makedirs(os.path.dirname(save_path) or ".", exist_ok=True)
    torch.save(model, save_path)
    print("Saved model to", save_path)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data_dir", required=True)
    parser.add_argument("--epochs", type=int, default=30)
    parser.add_argument("--save_path", default="models/lame_classifier.pth")
    args = parser.parse_args()
    train(args.data_dir, epochs=args.epochs, save_path=args.save_path)
