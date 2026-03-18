import React, { useState } from 'react';
import { Info, TrendingUp, AlertTriangle, CheckCircle2, Lightbulb, ChevronDown, ChevronUp, Clock } from 'lucide-react';

/**
 * SmartHelper Component
 * Displays intelligent suggestions and helpers for form fields
 */
export default function SmartHelper({ type = 'info', message, suggestion, details, compact = false }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const styles = {
    info: {
      bg: 'bg-blue-50 dark:bg-blue-950',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-700 dark:text-blue-300',
      icon: Info,
      iconColor: 'text-blue-500 dark:text-blue-400'
    },
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-950',
      border: 'border-emerald-200 dark:border-emerald-800',
      text: 'text-emerald-700 dark:text-emerald-300',
      icon: CheckCircle2,
      iconColor: 'text-emerald-500 dark:text-emerald-400'
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-700 dark:text-amber-300',
      icon: AlertTriangle,
      iconColor: 'text-amber-500 dark:text-amber-400'
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-950',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-700 dark:text-red-300',
      icon: AlertTriangle,
      iconColor: 'text-red-500 dark:text-red-400'
    },
    suggestion: {
      bg: 'bg-purple-50 dark:bg-purple-950',
      border: 'border-purple-200 dark:border-purple-800',
      text: 'text-purple-700 dark:text-purple-300',
      icon: Lightbulb,
      iconColor: 'text-purple-500 dark:text-purple-400'
    }
  };

  const style = styles[type] || styles.info;
  const Icon = style.icon;

  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${style.bg} ${style.border} border`}>
        <Icon className={`w-4 h-4 flex-shrink-0 ${style.iconColor}`} />
        <p className={`text-xs font-medium ${style.text}`}>{message}</p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl ${style.bg} ${style.border} border p-4 animate-in fade-in slide-in-from-top-2 duration-300`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${style.iconColor}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${style.text} leading-relaxed`}>
            {message}
          </p>
          
          {suggestion && (
            <div className={`mt-2 px-3 py-2 rounded-lg bg-white/50 dark:bg-black/20 ${style.text} text-xs font-semibold`}>
              💡 {suggestion}
            </div>
          )}
          
          {details && (
            <>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`mt-2 flex items-center gap-1 text-xs font-semibold ${style.text} hover:underline transition-colors`}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" />
                    Ẩn chi tiết
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    Xem chi tiết
                  </>
                )}
              </button>
              
              {isExpanded && (
                <div className={`mt-3 space-y-2 text-xs ${style.text} animate-in slide-in-from-top-2 duration-200`}>
                  {Object.entries(details).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center py-1 border-b border-current/20 last:border-0">
                      <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className="font-bold">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * BudgetSmartHelper - Specialized helper for budget field
 */
export function BudgetSmartHelper({ analysis, children }) {
  if (!analysis || analysis.level === 'none') return children;

  return (
    <div className="space-y-3">
      {children}
      <SmartHelper
        type={analysis.level === 'optimal' || analysis.level === 'acceptable' ? 'success' : 'warning'}
        message={analysis.message}
        suggestion={analysis.suggestion}
      />
    </div>
  );
}

/**
 * TimelineEstimator - Shows hiring timeline estimation
 */
export function TimelineEstimator({ timeline }) {
  if (!timeline) return null;

  return (
    <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 border border-indigo-200 dark:border-indigo-800 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
        <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-100">
          Timeline dự kiến
        </h4>
      </div>
      
      <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300 mb-3">
        {timeline.displayText}
      </p>
      
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 rounded-lg bg-white/50 dark:bg-black/20">
          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mb-1">Sàng lọc</p>
          <p className="text-sm font-bold text-indigo-900 dark:text-indigo-100">
            {timeline.breakdown.screening} ngày
          </p>
        </div>
        <div className="text-center p-2 rounded-lg bg-white/50 dark:bg-black/20">
          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mb-1">Phỏng vấn</p>
          <p className="text-sm font-bold text-indigo-900 dark:text-indigo-100">
            {timeline.breakdown.interview} ngày
          </p>
        </div>
        <div className="text-center p-2 rounded-lg bg-white/50 dark:bg-black/20">
          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mb-1">Trao offer</p>
          <p className="text-sm font-bold text-indigo-900 dark:text-indigo-100">
            {timeline.breakdown.offer} ngày
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * SmartSuggestionList - Shows list of suggestions with click to apply
 */
export function SmartSuggestionList({ title, suggestions, onSelect }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="rounded-xl bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 p-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-purple-500 dark:text-purple-400" />
          <h4 className="text-sm font-bold text-purple-900 dark:text-purple-100">
            {title}
          </h4>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-purple-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-purple-500" />
        )}
      </button>
      
      {isExpanded && (
        <div className="mt-3 space-y-2 animate-in slide-in-from-top-2 duration-200">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onSelect(suggestion)}
              className="w-full text-left p-2 rounded-lg bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 transition-colors text-xs text-purple-700 dark:text-purple-300 font-medium"
            >
              • {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * InsightCard - Display key insights about the job request
 */
export function InsightCard({ icon: Icon, label, value, trend, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
    emerald: 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300',
    amber: 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
    purple: 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300'
  };

  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon className="w-4 h-4" />}
        <span className="text-xs font-semibold uppercase tracking-wider opacity-75">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold mb-1">{value}</p>
      {trend && (
        <div className="flex items-center gap-1 text-xs font-medium opacity-75">
          <TrendingUp className="w-3 h-3" />
          {trend}
        </div>
      )}
    </div>
  );
}
